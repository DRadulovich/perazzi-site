# FIELDS IN THE BULK EDIT TEMPLATE

| Field                          | Description                                 | Format / Additional Information                                                            |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Item Type                      | Defines the item as a Product, SKU, or Rule | Type `Product` for products, `SKU` for variants, and `Rule` for variant or modifier rules. |
| Product ID                     | System-generated product identifier         | Required for updating existing products; must be blank for creating new products.          |
| Product Name                   | Name of the product                         | Must be unique. Max 250 characters.                                                        |
| Product Type                   | Physical or digital                         | `P` = physical, `D` = digital.                                                             |
| Product Code/SKU               | SKU used for inventory                      | Must be unique, max 255 characters, case-insensitive. No commas.                           |
| Bin Picking Number             | Warehouse location identifier               | Max 255 characters.                                                                        |
| Brand Name                     | Brand or manufacturer                       | Enter existing brand or new brand to create on import.                                     |
| Option Set                     | Option set name                             | Should be removed for v3 products to avoid duplicate options.                              |
| Option Set Align               | Option placement                            | `right` or `below`. Remove for v3 products.                                                |
| Product Description            | Product description                         | Text or HTML allowed.                                                                      |
| Price                          | Base price                                  | Numbers only (e.g. `24.99`).                                                               |
| Cost Price                     | Internal cost                               | Numbers only.                                                                              |
| Retail Price                   | MSRP                                        | Numbers only. Cannot be assigned to variants.                                              |
| Sale Price                     | Sale price                                  | Numbers only. Cannot be assigned to variants.                                              |
| Fixed Shipping Cost            | Flat shipping cost                          | Numbers only.                                                                              |
| Free Shipping                  | Enable free shipping                        | `Y` or `N`. Overrides other shipping rules.                                                |
| Product Warranty               | Warranty info                               | Text or HTML. Max 65,535 characters.                                                       |
| Product Weight                 | Weight                                      | Numbers only.                                                                              |
| Product Width                  | Width                                       | Numbers only.                                                                              |
| Product Height                 | Height                                      | Numbers only.                                                                              |
| Product Depth                  | Depth                                       | Numbers only.                                                                              |
| Allow Purchases?               | Allow purchase/pre-order                    | `Y` or `N`.                                                                                |
| Product Visible?               | Product visibility                          | `Y` = visible, `N` = hidden.                                                               |
| Product Availability           | Shipping time description                   | Text only. Max 255 characters.                                                             |
| Track Inventory                | Inventory tracking mode                     | `none`, `by product`, or `by option`.                                                      |
| Current Stock Level            | Units in stock                              | Numbers only.                                                                              |
| Low Stock Level                | Restock alert threshold                     | Numbers only.                                                                              |
| Category                       | Assigned categories                         | `Category1; Category2/Subcategory`. Escape `/` with `\/`. Max 1,000 categories.            |
| Product File - 1               | Digital product file                        | Filename only. Must exist in WebDAV first.                                                 |
| Product File Description - 1   | File description                            | Text.                                                                                      |
| Product File Max Downloads - 1 | Download limit                              | Numbers only.                                                                              |
| Product File Expires After - 1 | Download expiration                         | `# Days`, `# Weeks`, `# Months`, `# Years`, or `Never`.                                    |
| Product Image ID - 1           | Image ID                                    | Required for updating images; blank for new images.                                        |
| Product Image Path - 1         | Image filename or URL                       | Filename or full URL.                                                                      |
| Product Image Description - 1  | Image alt text                              | Max 255 characters.                                                                        |
| Product Image Is Thumbnail - 1 | Thumbnail selector                          | `Y` or `N`. Only one per product.                                                          |
| Product Image Sort - 1         | Image display order                         | Whole numbers only.                                                                        |
| Search Keywords                | Store search keywords                       | Comma-separated. Max 65,535 characters.                                                    |
| Page Title                     | SEO page title                              | Defaults to product name if blank.                                                         |
| Meta Keywords                  | SEO keywords                                | Comma-separated. Max 65,535 characters.                                                    |
| Meta Description               | SEO description                             | Max 65,535 characters.                                                                     |
| Product Condition              | Condition for Google Shopping               | `New`, `Used`, or `Refurbished`.                                                           |
| Show Product Condition?        | Display condition                           | `Y` or `N`.                                                                                |
| Sort Order                     | Category sort order                         | Whole numbers allowed, including negatives.                                                |
| Product Tax Class              | Tax class                                   | Max 255 characters.                                                                        |
| Product UPC/EAN                | UPC or EAN                                  | Max 32 characters.                                                                         |
| Stop Processing Rules          | Rule processing control                     | `Y` = stop rules below, `N` = continue.                                                    |
| Product URL                    | Custom URL path                             | `/relative-url/`, max 1,024 characters.                                                    |
| Redirect Old URL?              | Create 301 redirect                         | `Y` or `N`.                                                                                |
| Global Trade Item Number       | GTIN                                        | Text.                                                                                      |
| Manufacturer Part Number       | MPN                                         | Text.                                                                                      |
| Tax Provider Tax Code          | Tax provider ID                             | Used with automatic tax calculation.                                                       |
| Product Custom Fields          | Custom fields                               | `name=value;name=value`. Max 200 fields.                                                   |

---

# MANUALLY ENTERED FIELDS

| Field                            | Description                 | Format                            |
| -------------------------------- | --------------------------- | --------------------------------- |
| Brand + Name                     | Brand and product name      | Read-only.                        |
| Calculated Price                 | Storefront price            | Read-only.                        |
| Product Not Visible              | Product hidden status       | `Y` = not visible, `N` = visible. |
| Product Inventoried              | Inventory tracking enabled  | `Y` or `N`.                       |
| Date Added                       | Date product added          | Default `MM/DD/YYYY`.             |
| Date Modified                    | Last modified date          | Default `MM/DD/YYYY`.             |
| Product File Path - 1            | WebDAV file path            | Read-only reference.              |
| Product File Total Downloads - 1 | Download count              | Read-only.                        |
| Category Details                 | Category metadata           | Read-only.                        |
| Product Image File - 1           | WebDAV image path           | Read-only reference.              |
| Product Image URL - 1            | Full image URL              | Read-only.                        |
| Minimum Purchase Quantity        | Minimum order quantity      | Numbers only.                     |
| Maximum Purchase Quantity        | Maximum order quantity      | Numbers only.                     |
| Shipping Groups                  | ShipperHQ shipping group    | ShipperHQ only.                   |
| Origin Locations                 | ShipperHQ origin group      | ShipperHQ only.                   |
| Dimensional Rules                | ShipperHQ dimensional rules | ShipperHQ only.                   |

---

# SUPPORTED FIELDS FOR SKU IMPORT / EXPORT

| Field               | Description          | Format                                         |
| ------------------- | -------------------- | ---------------------------------------------- |
| Product SKU         | SKU identifier       | Required. Cannot be updated via import.        |
| Product UPC/EAN     | UPC or EAN           | Alphanumeric, max 32 characters.               |
| Stock Level         | Inventory count      | Numbers only.                                  |
| Product Width       | Width                | Numbers only.                                  |
| Product Height      | Height               | Numbers only.                                  |
| Product Depth       | Depth                | Numbers only.                                  |
| Free Shipping       | Enable free shipping | `Y` or `N`.                                    |
| Fixed Shipping Cost | Flat shipping cost   | Numbers only.                                  |
| Product Weight      | Weight               | Numbers only. Requires custom export template. |
