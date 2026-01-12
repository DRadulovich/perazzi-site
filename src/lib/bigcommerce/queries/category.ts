const CATEGORY_FIELDS = `
  entityId
  name
  path
  children {
    entityId
    name
    path
    children {
      entityId
      name
      path
      children {
        entityId
        name
        path
      }
    }
  }
`;

export const getCategoryTreeQuery = /* GraphQL */ `
  query CategoryTreeQuery {
    site {
      categoryTree {
        ${CATEGORY_FIELDS}
      }
    }
  }
`;
