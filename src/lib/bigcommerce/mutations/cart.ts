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

const CART_FIELDS = `
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
`;

export const createCartMutation = /* GraphQL */ `
  mutation CreateCartMutation($input: CreateCartInput!) {
    cart {
      createCart(input: $input) {
        cart {
          ${CART_FIELDS}
        }
      }
    }
  }
`;

export const addCartLineItemsMutation = /* GraphQL */ `
  mutation AddCartLineItemsMutation($input: AddCartLineItemsInput!) {
    cart {
      addCartLineItems(input: $input) {
        cart {
          ${CART_FIELDS}
        }
      }
    }
  }
`;

export const updateCartLineItemMutation = /* GraphQL */ `
  mutation UpdateCartLineItemMutation($input: UpdateCartLineItemInput!) {
    cart {
      updateCartLineItem(input: $input) {
        cart {
          ${CART_FIELDS}
        }
      }
    }
  }
`;

export const deleteCartLineItemMutation = /* GraphQL */ `
  mutation DeleteCartLineItemMutation($input: DeleteCartLineItemInput!) {
    cart {
      deleteCartLineItem(input: $input) {
        cart {
          ${CART_FIELDS}
        }
      }
    }
  }
`;

export const createCartRedirectUrlsMutation = /* GraphQL */ `
  mutation CreateCartRedirectUrlsMutation($cartId: String!) {
    cart {
      createCartRedirectUrls(input: { cartEntityId: $cartId }) {
        errors {
          __typename
        }
        redirectUrls {
          redirectedCheckoutUrl
        }
      }
    }
  }
`;
