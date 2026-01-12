const MONEY_FIELDS = `
  value
  currencyCode
`;

const CART_LINE_ITEM_FIELDS = `
  entityId
  name
  quantity
  productEntityId
  variantEntityId
  listPrice {
    ${MONEY_FIELDS}
  }
  extendedListPrice {
    ${MONEY_FIELDS}
  }
`;

export const getCartQuery = /* GraphQL */ `
  query CartQuery($cartId: String!) {
    site {
      cart(entityId: $cartId) {
        entityId
        currencyCode
        amount {
          ${MONEY_FIELDS}
        }
        lineItems {
          totalQuantity
          physicalItems {
            ${CART_LINE_ITEM_FIELDS}
          }
          digitalItems {
            ${CART_LINE_ITEM_FIELDS}
          }
        }
      }
    }
  }
`;
