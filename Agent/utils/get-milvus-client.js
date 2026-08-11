import { MilvusClient, MetricType } from "@zilliz/milvus2-sdk-node";

const getMilvusClient = () => {
  return new MilvusClient({ address: "localhost:19530" });
};

export { getMilvusClient };
