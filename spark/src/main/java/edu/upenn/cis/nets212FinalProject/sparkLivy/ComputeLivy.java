package edu.upenn.cis.nets212FinalProject.sparkLivy;
import edu.upenn.cis.nets212FinalProject.storage.DataManager;
import org.apache.livy.LivyClient;
import org.apache.livy.LivyClientBuilder;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.ExecutionException;

/**
* @author Batchema Sombie
* Main class. Updates analysis data on S3 and runs
* adsorption job on Livy
*/
public class ComputeLivy {
    public static void main(String[] args)
            throws IOException, URISyntaxException, InterruptedException, ExecutionException {
        DataManager manager = new DataManager();
        manager.updateTables();
        String livyURI = "http://ec2-3-93-236-121.compute-1.amazonaws.com:8998/"; // TODO: Always update this before starting the job
        LivyClient client = new LivyClientBuilder()
                .setURI(new URI(livyURI)).build();

        try {
            String jar = "target/nets212-final-project-0.0.1-SNAPSHOT.jar";
            client.uploadJar(new File(jar)).get();

            // Run Adsorption
            System.out.println("AdsorptionJob starting on Livy...");
            Boolean results = client.submit(new AdsorptionJob()).get();
            if (results) {
                System.out.println("Adsorption Job Done. Data Successfully uploaded to DynamoDB");
            } else {
                System.out.println("An error occurred during adsorption job. Check the logs");
            }
        } finally {
            client.stop(true);
            System.out.println("Livy stopped");
        }
    }
}
