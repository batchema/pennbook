package edu.upenn.cis.nets212FinalProject.storage;

import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

/**
 * @author Batchema Sombie
 * Class to connect to s3
 * Not a singleton because of internal Hadoop error
 */
public class S3Connector {
    static AmazonS3 s3;

    public static AmazonS3 getS3() {
        s3 = AmazonS3ClientBuilder.standard().withRegion(Regions.US_EAST_1).build();
        return s3;
    }
}
