import mongoose from "mongoose";
import { _config } from "./config";
import dns from 'dns';

// Set DNS servers for Node.js
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

interface ConnectionOptions extends mongoose.ConnectOptions {
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  family?: number;

}

const connectionOptions: ConnectionOptions = {
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4

};

export async function initDB(DBURL: string): Promise<any> {
  try {
    // Convert mongodb+srv:// to mongodb:// if needed
    let connectionString = DBURL;

    if (DBURL.startsWith('mongodb+srv://')) {
      console.log('Converting SRV connection string to standard format...');

      // Extract parts from the SRV URL
      const url = new URL(DBURL);
      const username = url.username;
      const password = url.password;
      const hostname = url.hostname;
      const database = url.pathname.slice(1).split('?')[0];

      // Manually resolve SRV
      try {
        const dnsPromises = dns.promises;
        const srvRecords = await dnsPromises.resolveSrv(`_mongodb._tcp.${hostname}`);
        console.log('SRV Records resolved:', srvRecords);

        // Build hosts from SRV records
        const hosts = srvRecords.map(record => `${record.name}:${record.port}`).join(',');

        // Build standard connection string
        connectionString = `mongodb://${username}:${password}@${hosts}/${database}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
        console.log('Using standard connection string');
      } catch (srvError) {
        console.error('SRV resolution failed, trying fallback hosts:', srvError);

        // Fallback to typical Atlas cluster naming
        const clusterName = hostname.split('.')[0];
        const hosts = [
          `${clusterName}-shard-00-00.9dplabg.mongodb.net:27017`,
          `${clusterName}-shard-00-01.9dplabg.mongodb.net:27017`,
          `${clusterName}-shard-00-02.9dplabg.mongodb.net:27017`
        ].join(',');

        connectionString = `mongodb://${username}:${password}@${hosts}/${database}?ssl=true&authSource=admin&retryWrites=true&w=majority&replicaSet=atlas-${clusterName}-shard-0`;
        console.log('Using fallback connection string');
      }
    }

    const connection = await mongoose.connect(connectionString, connectionOptions);
    console.log('DB connected');
    console.log("Database is now connected")

    setupEventListeners();
    setupGracefulShutdown();

    if (!connection.connection.db) {
      throw new Error('Database instance not available after connection');
    }

    return connection.connection.db;

  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

function setupEventListeners(): void {
  mongoose.connection.on('connected', () => {
    console.log('Mongoose default connection open');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose default connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose default connection disconnected');
  });
}

function setupGracefulShutdown(): void {
  const shutdownHandler = async (): Promise<void> => {
    try {
      await mongoose.connection.close();
      console.log('Mongoose connection disconnected through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', shutdownHandler);
  process.on('SIGTERM', shutdownHandler);
}