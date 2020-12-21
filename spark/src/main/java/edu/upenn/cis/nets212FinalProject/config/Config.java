package edu.upenn.cis.nets212FinalProject.config;

/**
 * Global configuration
 *
 * @author batchema
 */
public class Config {

    /**
     * The path to the space-delimited social network data
     */
    /**
     * DynamoDB tables
     */
    public static String FRIENDS_TABLE = "friends";
    public static String ARTICLES_TABLE = "news_articles";
    public static String ARTICLES_LIKES_TABLE = "article_likes_by_username";
    public static String CATEGORY_INTERESTS_TABLE = "accounts";
    public static String RECOMMENDATIONS_TABLE = "recommendations";

    /**
     * local files
     */
    public static String FRIENDS_LOCAL = "target/friends.txt";
    public static String ARTICLES_LOCAL = "target/articles.txt";
    public static String INTERESTS_LOCAL = "target/interests.txt";
    public static String LIKED_LOCAL = "target/liked.txt";
    /**
     * S3 Bucket and objects
     */
    public static String S3_BUCKET_URL = "newsrecommendations";
    public static String FRIENDS_S3 = "s3a://newsrecommendations/friends.txt";
    public static String ARTICLES_S3 = "s3a://newsrecommendations/articles.txt";
    public static String INTERESTS_S3 = "s3a://newsrecommendations/interests.txt";
    public static String LIKED_S3 = "s3a://newsrecommendations/liked.txt";

    /**
     * Test Spark
     */
    public static String LOCAL_SPARK = "local[*]";

    /**
     * How many RDD partitions to use?
     */
    public static int PARTITIONS = 5;
}
