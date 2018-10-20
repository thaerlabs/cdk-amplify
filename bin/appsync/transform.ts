import { writeFileSync, mkdirSync, existsSync } from 'fs';
import * as path from 'path';
import GraphQLTransform from 'graphql-transformer-core';
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer';
// import ModelConnectionTransformer from 'graphql-connection-transformer';
// import ModelAuthTransformer from 'graphql-auth-transformer';
import AppSyncTransformer from 'graphql-appsync-transformer';
import Resource from 'cloudform/types/resource';
// import VersionedModelTransformer from 'graphql-versioned-transformer';

const paths = {
  schema: path.resolve(__dirname, './schema.graphql'),
  out: path.resolve(__dirname, './dist'),
  tmpResources: path.resolve('./tmp/appsync.json')
};

// Note: This is not exact as we are omitting the @searchable transformer.
const transformer = new GraphQLTransform({
  transformers: [
    new AppSyncTransformer(),
    new DynamoDBModelTransformer()
    // new ModelAuthTransformer(),
    // new ModelConnectionTransformer(),
    // new VersionedModelTransformer()
  ]
});

interface TransformResult {
  schema: string;
  resources: {
    [key: string]: Resource;
  };
}

export function run(schema: string): TransformResult {
  const cfdoc = transformer.transform(schema);

  const out: any = {
    schema: null,
    tables: [],
    resolvers: []
  };

  if (cfdoc.Resources) {
    out.resources = cfdoc.Resources;

    writeFileSync(
      paths.tmpResources,
      JSON.stringify(cfdoc.Resources, null, 2),
      'utf-8'
    );

    // check we have an output folder
    if (!existsSync(paths.out)) {
      mkdirSync(paths.out);
      mkdirSync(`${paths.out}/resolvers`);
    }

    // create in not existing

    for (const key in cfdoc.Resources) {
      const resource = cfdoc.Resources[key];

      switch (resource.Type) {
        case 'AWS::AppSync::GraphQLSchema':
          if (resource.Properties) {
            writeFileSync(
              `${paths.out}/schema.graphql`,
              resource.Properties.Definition,
              'utf-8'
            );
            out.schema = resource.Properties.Definition;
          }
          break;
        case 'AWS::AppSync::Resolver':
          if (resource.Properties) {
            const props = resource.Properties;
            const name = `${paths.out}/resolvers/${props.TypeName}.${
              props.FieldName
            }`;
            writeFileSync(
              `${name}.request.vtl`,
              props.RequestMappingTemplate,
              'utf-8'
            );

            writeFileSync(
              `${name}.response.vtl`,
              props.ResponseMappingTemplate,
              'utf-8'
            );
          }
          break;
      }
    }
  }

  return out;
}
