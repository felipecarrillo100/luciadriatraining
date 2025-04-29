import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { NgModule } from '@angular/core';
import {ApolloClientOptions, ApolloLink, concat, InMemoryCache, InMemoryCacheConfig} from '@apollo/client/core';
import {AppSettings} from "../settings/AppSettings";
import introspection from "./introspection";

const uri = `${AppSettings.HxDRServer}/graphql`; // <-- add the URL of the GraphQL server here

const authMiddleware = new ApolloLink((operation, forward) => {
  // Adds the authorization token to the headers
  operation.setContext(({ headers = {} }) => {
    const token= AppSettings.getToken();
    const authorization = token ? `Bearer ${token}` : "";
    if (token) {
      return {
        headers: {
          ...headers,
          authorization
        }
      }
    } else {
      return {
        headers
    }
  }});
  return forward(operation);
})

export const CacheSettings:  InMemoryCacheConfig = {
  addTypename: true,
  possibleTypes: introspection.possibleTypes,
}
export function createApollo(httpLink: HttpLink): ApolloClientOptions<any> {
  return {
     link: concat(authMiddleware, httpLink.create({ uri })),
    cache: new InMemoryCache(CacheSettings),
  };
}

@NgModule({
  exports: [ApolloModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}
