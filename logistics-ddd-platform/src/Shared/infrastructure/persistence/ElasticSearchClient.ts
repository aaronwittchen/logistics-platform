import { Client } from '@elastic/elasticsearch';
import { log } from '@/utils/log';

export class ElasticSearchClient {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200',
    });
  }

  async createIndex(index: string, mappings: any): Promise<void> {
    const exists = await this.client.indices.exists({ index });

    if (!exists) {
      await this.client.indices.create({
        index,
        body: { mappings },
      });
      log.ok(`Created index: ${index}`);
    }
  }

  async index(index: string, id: string, document: any): Promise<void> {
    await this.client.index({
      index,
      id,
      body: document,
      refresh: 'true',
    });
  }

  async get(index: string, id: string): Promise<any> {
    try {
      const result = await this.client.get({
        index,
        id,
      });
      return result._source;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async search(index: string, query: any): Promise<any[]> {
    const result = await this.client.search({
      index,
      body: { query },
    });
    return result.hits.hits.map((hit: any) => hit._source);
  }

  async update(index: string, id: string, document: any): Promise<void> {
    try {
      await this.client.update({
        index,
        id,
        body: { doc: document },
        refresh: 'true',
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        // Document doesn't exist, create it instead
        await this.index(index, id, document);
        return;
      }
      throw error;
    }
  }

  async delete(index: string, id: string): Promise<void> {
    try {
      await this.client.delete({
        index,
        id,
        refresh: 'true',
      });
    } catch (error: any) {
      if (error.statusCode === 404) {
        // Document doesn't exist, nothing to delete
        return;
      }
      throw error;
    }
  }

  async bulkIndex(index: string, documents: Array<{ id: string; document: any }>): Promise<void> {
    const body = documents.flatMap(({ id, document }) => [
      { index: { _index: index, _id: id } },
      document,
    ]);

    await this.client.bulk({
      body,
      refresh: 'true',
    });
  }

  getClient(): Client {
    return this.client;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Use a simpler ping/info request instead of cluster.health()
      const info = await this.client.info();
      log.info(`ElasticSearch connected - version: ${info.version?.number || 'unknown'}`);
      return true;
    } catch (error) {
      log.err(`ElasticSearch health check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}