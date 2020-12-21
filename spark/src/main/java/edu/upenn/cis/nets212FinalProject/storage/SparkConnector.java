package edu.upenn.cis.nets212FinalProject.storage;

import java.io.File;

import edu.upenn.cis.nets212FinalProject.config.Config;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;


/**
 * @author Batchema Sombie
 * Singleton class to handle spark context connection
 */
public class SparkConnector {
    static SparkSession spark = null;
    static JavaSparkContext context = null;

    public static SparkSession getSparkConnection() {
        return getSparkConnection(null);
    }

    public static synchronized SparkSession getSparkConnection(String host) {
        if (spark == null) {
            if (System.getenv("HADOOP_HOME") == null) {
                File workaround = new File(".");
                System.setProperty("hadoop.home.dir", workaround.getAbsolutePath() + "/native" +
                        "-libs");
            }

            if (host != null && !host.startsWith("spark://"))
                host = "spark://" + host + ":7077";

            spark = SparkSession
                    .builder()
                    .appName("nets212FinalG03")
                    .master((host == null) ? Config.LOCAL_SPARK : host)
                    .getOrCreate();
            spark.sparkContext().hadoopConfiguration()
                    .set("fs.s3n.endpoint", "s3.aws.com");
        }

        return spark;
    }

    public static synchronized JavaSparkContext getSparkContext() {
        if (context == null)
            context = new JavaSparkContext(getSparkConnection().sparkContext());

        return context;
    }
}
