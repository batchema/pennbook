package edu.upenn.cis.nets212FinalProject.storage;

import com.amazonaws.AmazonServiceException;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.ScanRequest;
import com.amazonaws.services.dynamodbv2.model.ScanResult;
import com.amazonaws.services.s3.AmazonS3;
import edu.upenn.cis.nets212FinalProject.config.Config;
import edu.upenn.cis.nets212FinalProject.utils.MyPair;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * @author Batchema Sombie
 * Class to fetch Adsorption job data from
 * DynamoDB onto S3
 */
public class DataManager {

    AmazonDynamoDB client;

    public DataManager() {
        client = DynamoConnector.getClient();
    }

    void downloadTable(String tableName, List<MyPair<String, Boolean>> targetColumns,
                       String outputFile) throws IOException {
        System.out.printf("Downloading table %s...%n", tableName);
        // Create file writing and indexing variables
        StringBuilder builder;
        int i;
        int counter = 0;
        // Download items and write target columns to file as comma-separated values
        BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile));
        Map<String, AttributeValue> lastKeyEvaluated = null;
        // Paginated DynamoDB table scan
        do {
            ScanRequest scanRequest = new ScanRequest()
                    .withTableName(tableName)
                    .withExclusiveStartKey(lastKeyEvaluated);
            ScanResult scanResult = client.scan(scanRequest);
            for (Map<String, AttributeValue> item : scanResult.getItems()) {
                builder = new StringBuilder();
                for (i = 0; i < targetColumns.size(); i++) {
                    MyPair<String, Boolean> currColumn = targetColumns.get(i);
                    if (currColumn.getRight()) {
                        List<AttributeValue> aList = item.get(currColumn.getLeft()).getL();
                        for (int j = 0; j < aList.size(); j++) {
                            builder.append(aList.get(j).getS());
                            if (j != targetColumns.size() - 1)
                                builder.append(",");
                        }
                    } else {
                        builder.append(item.get(currColumn.getLeft()).getS());
                    }
                    if (i != targetColumns.size() - 1)
                        builder.append(",");
                }
                writer.write(builder.toString());
                writer.flush();
                writer.newLine();
                counter++;
                if (counter >= 100)
                    break;
            }
            lastKeyEvaluated = scanResult.getLastEvaluatedKey();
        } while (lastKeyEvaluated != null);
        System.out.printf("Downloaded and wrote %d items to disk from %s%n", counter, tableName);
    }

    void downloadTables() throws IOException {
        System.out.println("Transfering data from DynamoDB to disk...");
        // download article-category relations
        downloadTable(Config.ARTICLES_TABLE,
                new ArrayList<>(Arrays.asList(new MyPair<>("article_id", false),
                        new MyPair<>("category", false))),
                Config.ARTICLES_LOCAL);

        // Download user-user relations
        downloadTable(Config.FRIENDS_TABLE,
                new ArrayList<>(
                        Arrays.asList(new MyPair<>("friendA", false),
                                new MyPair<>("friendB", false))),
                Config.FRIENDS_LOCAL);

        // Download user-category relations
        downloadTable(Config.CATEGORY_INTERESTS_TABLE,
                new ArrayList<>(
                        Arrays.asList(new MyPair<>("username", false),
                                new MyPair<>("interests", true))),
                Config.INTERESTS_LOCAL);

        // Download user-article relations
        downloadTable(Config.ARTICLES_LIKES_TABLE,
                new ArrayList<>(
                        Arrays.asList(new MyPair<>("username", false),
                                new MyPair<>("article_id", false))),
                Config.LIKED_LOCAL);
        System.out.println("Data transfer to disk terminated");
    }

    void updateTable(String s3Key, String localFilePath) {

        final AmazonS3 s3 =
                S3Connector.getS3();
        try {
            s3.putObject(Config.S3_BUCKET_URL, s3Key, new File(localFilePath));
        } catch (AmazonServiceException e) {
            System.err.println(e.getErrorMessage());
            System.exit(1);
        }
    }

    public void updateTables() throws IOException {
        downloadTables();
        updateTable("articles.txt", Config.ARTICLES_LOCAL);
        updateTable("friends.txt", Config.FRIENDS_LOCAL);
        updateTable("interests.txt", Config.INTERESTS_LOCAL);
        updateTable("liked.txt", Config.LIKED_LOCAL);
        cleanDisk();
    }

    void cleanDisk() {
        boolean diskCleaned = deleteFile(Config.ARTICLES_LOCAL)
                && deleteFile(Config.FRIENDS_LOCAL)
                && deleteFile(Config.INTERESTS_LOCAL)
                && deleteFile(Config.LIKED_LOCAL);
        System.out.println("Files Removed: " + diskCleaned);
    }

    boolean deleteFile(String filePath) {
        File file = new File(filePath);
        return file.delete();
    }

    public static void main(String[] args) throws IOException {
        DataManager manager = new DataManager();
        manager.updateTable("articles.txt", "target/tests/articles.txt");
        manager.updateTable("friends.txt", "target/tests/friends.txt");
        manager.updateTable("interests.txt", "target/tests/interests.txt");
        manager.updateTable("liked.txt", "target/tests/liked.txt");
//        manager.updateTables();
    }
}
