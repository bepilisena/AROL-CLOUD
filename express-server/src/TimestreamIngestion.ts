import mongoClient from "./configs/MongoClient";
import { Document } from "mongodb";

const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });

var https = require("http");
var agent = new https.Agent({
  maxSockets: 5000,
});

const TIMESTREAM_DB_NAME = "testDB";
const TIMESTREAM_TABLE_NAME = "testTable";

let writeClient = new AWS.TimestreamWrite({
  endpoint: process.env.TIMESTREAM_ENDPOINT_URL, // required for localstack
  accessKeyId: process.env.TIMESTREAM_ACCESS_KEY,
  secretAccessKey: process.env.TIMESTREAM_SECRET_KEY,
  maxRetries: 10,
  httpOptions: {
    timeout: 20000,
    agent: agent,
  },
});
let queryClient = new AWS.TimestreamQuery({
  endpoint: process.env.TIMESTREAM_ENDPOINT_URL, // required for localstack
  accessKeyId: process.env.TIMESTREAM_ACCESS_KEY,
  secretAccessKey: process.env.TIMESTREAM_SECRET_KEY,
});

async function readEntriesFromMongoDB() {
  const aggregate = [
    {
      $sort: { first_time: -1 },
    },
    {
      $project: {
        _id: 0,
        folder: 1,
        variable: 1,
        samples: {
          $filter: {
            input: "$samples",
            as: "sample",
            cond: {
              $and: [
                {
                  $ne: ["$$sample.time", null],
                },
                {
                  $gte: ["$$sample.time", Number.MIN_SAFE_INTEGER],
                },
              ],
            },
          },
        },
      },
    },
  ];

  let sensorData: {
    name: string;
    value: number;
    time: number;
  }[] = [];
  let collections = ["eqtq", "plc", "drive"];

  for (const collection of collections) {
    let queryResults = mongoClient.db("arol").collection(collection).aggregate(aggregate);
    await queryResults.forEach((queryResultObject: Document) => {
      if (queryResultObject["folder"]) {
        sensorData.push(...queryResultObject.samples);
      } else if (queryResultObject["variable"]) {
        sensorData.push(
          ...queryResultObject.samples.map((el: any) => ({
            name: queryResultObject.variable,
            value: el.value,
            time: el.time,
          })),
        );
      }
    });
  }

  return sensorData;
}

async function timestreamIngestion() {
  let sensorData: { name: string; value: number; time: number }[] = await readEntriesFromMongoDB();

  let records = sensorData.map((el) => ({
    MeasureName: el.name.toString(),
    MeasureValue: el.value.toString(),
    MeasureValueType: "DOUBLE",
    Time: (el.time / 1000).toString(),
  }));

  const chunkSize = 50;
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);

    let params = {
      DatabaseName: TIMESTREAM_DB_NAME,
      TableName: TIMESTREAM_TABLE_NAME,
      Records: chunk,
    };

    try {
      await writeClient.writeRecords(params).promise();
    } catch (e) {
      console.log(e);
    }

    // do whatever
  }
}

async function timestreamQuery() {
  let query =
    "SELECT time as time, measure_value::double as measureValue FROM testDB.testTable WHERE measure_name='H23_AverageTorque'";

  let response = await queryClient
    .query({
      QueryString: query,
    })
    .promise();
}

export default {
  timestreamIngestion,
  timestreamQuery,
};
