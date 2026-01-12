export const getRouteEntityQuery = /* GraphQL */ `
  query RouteEntityQuery($path: String!) {
    site {
      route(path: $path) {
        node {
          __typename
          ... on Product {
            entityId
          }
          ... on Category {
            entityId
          }
          ... on Brand {
            entityId
          }
          ... on NormalPage {
            entityId
          }
          ... on ContactPage {
            entityId
          }
          ... on RawHtmlPage {
            entityId
          }
        }
      }
    }
  }
`;
