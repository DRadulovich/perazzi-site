const PRODUCT_IMAGE_FIELDS = `
  url(width: 1200)
  altText
`;

const PRODUCT_SUMMARY_FIELDS = `
  entityId
  name
  path
  sku
  availabilityV2 {
    status
  }
  brand {
    name
  }
  defaultImage {
    ${PRODUCT_IMAGE_FIELDS}
  }
  images {
    edges {
      node {
        ${PRODUCT_IMAGE_FIELDS}
      }
    }
  }
  prices {
    price {
      value
      currencyCode
    }
    priceRange {
      min {
        value
        currencyCode
      }
      max {
        value
        currencyCode
      }
    }
  }
`;

const PRODUCT_DETAIL_FIELDS = `
  ${PRODUCT_SUMMARY_FIELDS}
  description
  plainTextDescription
  productOptions {
    edges {
      node {
        entityId
        displayName
        ... on MultipleChoiceOption {
          values {
            edges {
              node {
                label
              }
            }
          }
        }
      }
    }
  }
  variants {
    edges {
      node {
        entityId
        isPurchasable
        prices {
          price {
            value
            currencyCode
          }
          priceRange {
            min {
              value
              currencyCode
            }
            max {
              value
              currencyCode
            }
          }
        }
        options {
          edges {
            node {
              displayName
              values {
                edges {
                  node {
                    label
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const searchProductsQuery = /* GraphQL */ `
  query SearchProductsQuery(
    $first: Int
    $after: String
    $filters: SearchProductsFiltersInput!
    $sort: SearchProductsSortInput
  ) {
    site {
      search {
        searchProducts(filters: $filters, sort: $sort) {
          products(first: $first, after: $after) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            collectionInfo {
              totalItems
            }
            edges {
              node {
                ${PRODUCT_SUMMARY_FIELDS}
              }
            }
          }
        }
      }
    }
  }
`;

export const getProductQuery = /* GraphQL */ `
  query ProductQuery($entityId: Int!) {
    site {
      product(entityId: $entityId) {
        ${PRODUCT_DETAIL_FIELDS}
      }
    }
  }
`;
