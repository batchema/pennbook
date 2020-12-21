package edu.upenn.cis.nets212FinalProject.sparkLivy;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;
import com.amazonaws.services.dynamodbv2.document.Item;
import com.amazonaws.services.dynamodbv2.document.Table;
import edu.upenn.cis.nets212FinalProject.storage.SparkConnector;
import edu.upenn.cis.nets212FinalProject.config.Config;
import edu.upenn.cis.nets212FinalProject.storage.DataManager;
import edu.upenn.cis.nets212FinalProject.storage.DynamoConnector;
import org.apache.livy.Job;
import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.api.java.function.Function;
import org.apache.spark.sql.SparkSession;
import scala.Tuple2;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
* @author Batchema Sombie
* Adsorption Job runner class
*/
public class AdsorptionJob implements Job<Boolean> {

    private static final long serialVersionUID = 1L;

    /**
     * Connection to Apache Spark
     */
    SparkSession spark;

    JavaSparkContext context;

    DynamoDB db;
    AmazonDynamoDB client;

    DataManager manager;

    JavaPairRDD<String, String> types;


    public AdsorptionJob() {
        System.out.println("Adsorption Job created");
    }

    /**
     * Initialize the database connection and open the file
     *
     */
    public void initialize() {
        System.out.println("Initializing Process...");
        System.out.println("Setting network access cache property");
        java.security.Security.setProperty("networkaddress.cache.ttl" , "60");
        System.out.println("Connecting to Spark...");
        spark = SparkConnector.getSparkConnection();
        context = SparkConnector.getSparkContext();
        System.out.println("Connected to Spark!");

        System.out.println("Connecting to DynamoDB...");
        db = DynamoConnector.getDB();
        client = DynamoConnector.getClient();
        System.out.println("Connected to DynamoDB!");
        manager = new DataManager();
    }

    JavaPairRDD<Tuple2<String, String>, Double> getNetwork() throws IOException {

        // Download target tables from DynamoDB to txt file to SparkContext
        System.out.println("Getting network data from S3...");
        JavaRDD<String> friends = context.textFile(Config.FRIENDS_S3);
        JavaRDD<String> articles = context.textFile(Config.ARTICLES_S3);
        JavaRDD<String> interests = context.textFile(Config.INTERESTS_S3);
        JavaRDD<String> liked = context.textFile(Config.LIKED_S3);
        JavaPairRDD<Tuple2<String, String>, Double> network;
        System.out.println("Network data aquired");

        /************** Populate Network with all needed undirected edges *******************/
        System.out.println("Adding Network edges...");
        /*
         * User-User relations
         */
        System.out.println("Adding user-user edges...");
        JavaPairRDD<String, String> _friends = friends.mapToPair(f -> {
            String[] temp = f.split(",");
            return new Tuple2<>(temp[0].trim(), temp[1].trim());
        });
        // Initialize weights per user
        JavaPairRDD<String, Double> friendWeights = _friends.groupByKey().mapToPair(f -> {
            long count = f._2.spliterator().getExactSizeIfKnown();
            return new Tuple2<>(f._1, 0.3 / count);
        });
        // Initialize weighted user-user Relations
        JavaPairRDD<Tuple2<String, String>, Double> weightedFriendships =
                _friends.join(friendWeights).mapToPair(f ->
                        new Tuple2<>(new Tuple2<>(f._1, f._2._1), f._2._2));
        System.out.println("Added user-user edges");

        /*
         * Article-Category relations
         */
        System.out.println("Adding article-category edges...");
        JavaPairRDD<String, String> _articles = articles.mapToPair(f -> {
            String[] temp = f.split(",");
            return new Tuple2<>(temp[0].trim(), temp[1].trim());
        });
        // Initialize weights per category
        JavaPairRDD<String, Double> categoryWeights =
                _articles.mapToPair(f -> new Tuple2<>(f._2, f._1)).groupByKey().mapToPair(f -> {
                    long count = f._2.spliterator().getExactSizeIfKnown();
                    return new Tuple2<>(f._1, 1.0 / count);
                });
        // Initialize weighted category-article Relations
        JavaPairRDD<Tuple2<String, String>, Double> weightedCategoryToArticles =
                _articles.mapToPair(f -> new Tuple2<>(f._2, f._1)).
                        join(categoryWeights).mapToPair(f ->
                        new Tuple2<>(new Tuple2<>(f._1, f._2._1), f._2._2));
        weightedCategoryToArticles = weightedCategoryToArticles
                .union(weightedCategoryToArticles.mapToPair(x ->
                        new Tuple2<>(new Tuple2<>(x._1._2, x._1._1), x._2)));
        System.out.println("Added article-category edges");

        /*
         * User-Category relations
         */
        System.out.println("Adding user-category edges...");
        JavaPairRDD<String, String> _interests = interests.mapToPair(f -> {
            String[] temp = f.split(",");
            return new Tuple2<>(temp[0].trim(), temp[1].trim());
        });
        // Initialize weights per interest
        JavaPairRDD<String, Double> interestsWeight =
                _interests.groupByKey().mapToPair(f -> {
                    long count = f._2.spliterator().getExactSizeIfKnown();
                    return new Tuple2<>(f._1, 0.3 / count);
                });
        // Initialize weighted user-category Relations
        JavaPairRDD<Tuple2<String, String>, Double> weightedInterests =
                _interests.join(interestsWeight).mapToPair(f ->
                        new Tuple2<>(new Tuple2<>(f._1, f._2._1), f._2._2));
        weightedInterests = weightedInterests.union(weightedInterests.mapToPair(x ->
                new Tuple2<>(new Tuple2<>(x._1._2, x._1._1), x._2)));
        System.out.println("Added user-category edges");

        /*
         * User-Article relations
         */
        System.out.println("Adding user-article edges...");
        JavaPairRDD<String, String> _liked = liked.mapToPair(f -> {
            String[] temp = f.split(",");
            return new Tuple2<>(temp[0].trim(), temp[1].trim());
        });

        // Initialize weights per article liked
        JavaPairRDD<String, Double> likedWeight =
                _liked.groupByKey().mapToPair(f -> {
                    long count = f._2.spliterator().getExactSizeIfKnown();
                    return new Tuple2<>(f._1, 0.4 / count);
                });
        // Initialize weighted user-likedArticle Relations
        JavaPairRDD<Tuple2<String, String>, Double> weightedReadArticles =
                _liked.join(likedWeight).mapToPair(f ->
                        new Tuple2<>(new Tuple2<>(f._1, f._2._1), f._2._2));
        weightedReadArticles = weightedReadArticles.union(weightedReadArticles.mapToPair(x ->
                new Tuple2<>(new Tuple2<>(x._1._2, x._1._1), x._2)));
        System.out.println("Added user-article edges");

        System.out.println("All edges added");
        System.out.println("Saving node types...");

        /*
         * Save Types
         */
        types = _friends.mapToPair(f -> new Tuple2<>(f._1, "user"));
        types = types.union(_articles.mapToPair(a -> new Tuple2<>(a._1, "article")));
        types = types.union(_articles.mapToPair(a -> new Tuple2<>(a._2, "category")));

        System.out.println("initializing full network...");
        // Initialize network
        network = weightedFriendships;
        network = network.union(weightedCategoryToArticles);
        network = network.union(weightedInterests);
        network = network.union(weightedReadArticles);

        // For every key, add entry (key, key, 1)
        network = network.union(network.groupByKey()
                .mapToPair(f -> new Tuple2<>(new Tuple2<>(f._1._1, f._1._1), 1.0)));
        System.out.println("Network fully initialized");

        return network.distinct();
    }

    public boolean run() throws IOException, InterruptedException {
        System.out.println("Starting adsorption job");
        JavaPairRDD<Tuple2<String, String>, Double> network = getNetwork();
        if (network == null) {
            System.out.println("Job failed due to data aggregation failure");
            return false;
        }

        // Delta
        double delta;
        boolean converged = false;
        int limit = 10;

        System.out.println("Initializing Adsorption variables and RDDs");
        /*
        Initialize Everything
         */
        // EdgeTransferRDD F,<T, W>
        JavaPairRDD<String, Tuple2<String, Double>> edgeTransferRDD = network.mapToPair(x ->
                new Tuple2<>(x._1._1, new Tuple2<>(x._1._2, x._2)));
        // initRanksRDD F, 1.0 Everyone starts with a rank of 1
        JavaPairRDD<String, Double> _ranks = edgeTransferRDD.mapToPair(x ->
                new Tuple2<>(x._1, 1.0));
        // initRanksPairedRDD F <T, RW> Transfer ranks to edges
        JavaPairRDD<String, Tuple2<String, Double>> initRanksRDD = _ranks.join(edgeTransferRDD)
                .mapToPair(x -> new Tuple2<>(x._2._2._1, new Tuple2<>(x._1, x._2._2._2 * x._2._1)));
        //Scale everything to sum up to 1
        JavaPairRDD<String, Double> scalerRDD = initRanksRDD.groupByKey().mapToPair(x -> {
            double denom = 0.0;
            for (Tuple2<String, Double> tup : x._2) {
                denom += tup._2;
            }
            return new Tuple2<>(x._1, 1.0 / denom);
        });
        initRanksRDD = initRanksRDD.join(scalerRDD).mapToPair(x ->
                new Tuple2<>(x._1, new Tuple2<>(x._2._1._1, x._2._1._2 * x._2._2)));

        // Remove Duplicates
        JavaPairRDD<Tuple2<String, String>, Double> dupRemoverRDD =
                initRanksRDD.mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1, x._2._1),
                        x._2._2));
        initRanksRDD = dupRemoverRDD.groupByKey().mapToPair(x -> {
            double rankSum = 0.0;
            for (Double d : x._2) {
                rankSum += d;
            }
            return new Tuple2<>(x._1, rankSum);
        }).mapToPair(x -> new Tuple2<>(x._1._1, new Tuple2<>(x._1._2, x._2)));
        System.out.printf("ranks initialized with %d nodes...%n", initRanksRDD.count());
        System.out.println("starting main loop...");

        // Loop
        int i = 0;
        while (!converged) {
            // Propagate Ranks
            JavaPairRDD<String, Tuple2<String, Double>> propagateRDD =
                    initRanksRDD.join(edgeTransferRDD).mapToPair(x -> new Tuple2<>(x._2._2._1,
                            new Tuple2<>(x._2._1._1,
                            x._2._1._2 * x._2._2._2)));

            // Scale ranks to sum to 1
            scalerRDD = propagateRDD.groupByKey().mapToPair(x -> {
                double denom = 0.0;
                for (Tuple2<String, Double> tup : x._2) {
                    denom += tup._2;
                }
                return new Tuple2<>(x._1, 1.0 / denom);
            });
            JavaPairRDD<String, Tuple2<String, Double>> newRanksRDD =
                    propagateRDD.join(scalerRDD).mapToPair(x ->
                            new Tuple2<>(x._1, new Tuple2<>(x._2._1._1, x._2._1._2 * x._2._2)));

            // Remove Duplicates
            dupRemoverRDD = newRanksRDD.mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1, x._2._1),
                    x._2._2));
            newRanksRDD = dupRemoverRDD.groupByKey().mapToPair(x -> {
                double rankSum = 0.0;
                for (Double d : x._2) {
                    rankSum += d;
                }
                return new Tuple2<>(x._1, rankSum);
            }).mapToPair(x -> new Tuple2<>(x._1._1, new Tuple2<>(x._1._2, x._2)));

            // A -> A, 1.0
            newRanksRDD = newRanksRDD.mapToPair(x -> {
                if (x._1.equals(x._2._1))
                    return new Tuple2<>(x._1, new Tuple2<>(x._1, 1.0));
                else
                    return x;
            });

            // Check for convergence
            JavaRDD<Double> deltas = newRanksRDD
                    .mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1, x._2._1), x._2._2))
                    .join(initRanksRDD.mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1, x._2._1),
                            x._2._2))).map(x -> x._2._1 - x._2._2);
            deltas = deltas.sortBy((Function<Double, Double>) v1 -> v1, false, 1);
            delta = deltas.first();
            initRanksRDD = newRanksRDD;
            System.out.printf("Iteration %d done with delta %f and RDD count %d...%n", i++, delta
                    , newRanksRDD.count());
            if (i >= limit || delta < 0.0025)
                converged = true;
        }

        // Collect Articles
        // types: A -> Type
        // Ranks: A -> B -> Weight
        // Filter out everything not keyed by a user
        JavaPairRDD<String, Tuple2<String, Double>> filterUsersRDD =
                initRanksRDD.join(types).mapToPair(x -> {
                    if (x._2._2.equals("user"))
                        return new Tuple2<>(x._1, x._2._1);
                    else
                        return new Tuple2<>(x._1, null);
                });
        filterUsersRDD = filterUsersRDD.filter((Function<Tuple2<String, Tuple2<String, Double>>,
                Boolean>) x -> x._2 != null).distinct();
        // Filter out everything whose target node is not an article
        HashSet<String> articleSet = new HashSet<>();
        types.filter((Function<Tuple2<String, String>, Boolean>) x ->
                x._2.equals("article")).collectAsMap()
                .forEach((k, v) -> articleSet.add(k));
        filterUsersRDD = filterUsersRDD.filter((Function<Tuple2<String, Tuple2<String, Double>>,
                Boolean>) v1 -> articleSet.contains(v1._2._1));

        JavaPairRDD<String, HashSet<String>> recommendationsRDD =
                filterUsersRDD.groupByKey().mapToPair(x -> {
                    ArrayList<Tuple2<String, Double>> artcl = new ArrayList<>();
                    x._2.forEach(y -> artcl.add(y));
                    ArrayList<Tuple2<String, Double>> artclSorted = artcl.stream()
                            .sorted((a, b) -> b._2.compareTo(a._2))
                            .collect(Collectors.toCollection(ArrayList::new));
                    HashSet<String> tops =
                            (HashSet<String>) artclSorted.subList(0, 5)
                                    .stream().map(ar -> ar._1)
                                    .collect(Collectors.toSet());
                    return new Tuple2<>(x._1, tops);
                });

        // Upload to DynamoDB
        Table recommendationsTable = db.getTable(Config.RECOMMENDATIONS_TABLE);

        recommendationsRDD.collect().stream().forEach(x -> {
            Item item = new Item()
                    .withPrimaryKey("username", x._1)
                    .withStringSet("article_ids", x._2);
            recommendationsTable.putItem(item);
        });

        return true;
    }

    @Override
    public Boolean call(JobContext arg0) throws Exception {
        initialize();
        return run();
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        AdsorptionJob job = new AdsorptionJob();
        job.initialize();
        System.out.printf("Job finish status: %s%s", job.run());
    }
}
