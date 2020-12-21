package edu.upenn.cis.nets212FinalProject.storage;

import com.amazonaws.regions.Regions;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.document.DynamoDB;


/**
 * @author zives
 * @author Batchema Sombie
 * Handles connections to DynamoDB
 */
public class DynamoConnector {
    static DynamoDB db;
    static AmazonDynamoDB client;

    public static DynamoDB getDB() {
        if (db != null)
            return db;

        db = new DynamoDB(
                AmazonDynamoDBClientBuilder.standard()
                        .withRegion(Regions.US_EAST_1)
                        .build());
        return db;
    }

    public static AmazonDynamoDB getClient() {
        if (client != null)
            return client;

        client =
                AmazonDynamoDBClientBuilder.standard()
                        .withRegion(Regions.US_EAST_1)
                        .build();
        return client;
    }


    /**
     * Orderly shutdown
     */
    public static void shutdown() {
        if (db != null) {
            db.shutdown();
            db = null;
        }
    }
}
