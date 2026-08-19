FROM docker.elastic.co/elasticsearch/elasticsearch:8.17.0

# You can add the IK plugin installation here later if needed
# For now, using base Elasticsearch image to get the compose workingx

# 安装 IK 分词（版本严格和 ES 一致）
RUN elasticsearch-plugin install --batch \
    https://release.infinilabs.com/analysis-ik/stable/elasticsearch-analysis-ik-8.17.0.zip