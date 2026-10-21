=== Open Lister for Amazon ===
Contributors: openlister
Tags: amazon, woocommerce, marketplace, listing, inventory sync
Requires at least: 6.2
Tested up to: 6.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free WooCommerce to Amazon integration: list products, sync price and stock, import orders, and research best-selling products.

== Description ==

Open Lister for Amazon connects your WooCommerce store directly to Amazon's Selling Partner API (SP-API). It has no subscription and no middleman server. Your store talks to Amazon with your own credentials.

**Listing**

* Sell on an existing Amazon product page by ASIN (offer-only listing). Use the "Find on Amazon" button to look up the ASIN by UPC/EAN or name.
* Or create a brand-new Amazon product under any product type (SHIRT, HOME, TOY_FIGURE and so on), with title, brand, bullets, description, images and UPC/EAN/GTIN filled in from WooCommerce.
* Variable products: list each variation against its own ASIN, or create a full Amazon parent/child variation family (for example SIZE/COLOR).
* "Check with Amazon" runs a validation-only submission and shows exactly which attributes Amazon still needs.
* Bulk actions on the Products screen: List, Sync, Refresh status, End listing.
* Merchant fulfilled or FBA.

**Syncing**

* Price and stock changes in WooCommerce are pushed to Amazon automatically in the background through Action Scheduler.
* A store-wide price rule (for example +15% to cover fees), per-product price overrides, and a stock buffer to prevent overselling.

**Orders**

* Imports Amazon orders into WooCommerce every 15 minutes and reduces stock (optional for FBA).
* Tracks Amazon status changes such as shipped or cancelled.
* Add a carrier and tracking number, mark the order Completed, and the shipment is confirmed on Amazon.
* HPOS (High-Performance Order Storage) compatible.

**Product research**

* Save keyword searches (for example "comfy shirts"). Each run finds the best-selling Amazon items, ranked by Best Sellers Rank, Buy Box price and the number of competing sellers.
* Shows which Amazon categories the keyword falls into, plus **ideas from similar categories**: best sellers in neighbouring categories that shoppers in the same space buy.
* Schedule each search to run hourly, twice a day, daily or weekly, starting at a time you choose. Results can be emailed to you.
* "Add to my store" turns a result into a draft WooCommerce product, already linked to that ASIN.
* Note: Amazon's seller API does not provide star ratings or review counts. Open an item on Amazon to read its reviews.

== Installation ==

1. Upload the `open-lister-for-amazon` folder to `/wp-content/plugins/` and activate it. WooCommerce must be active.
2. Get free SP-API credentials. You register as a **private developer** because you only use them for your own store. The annual fee Amazon introduced in 2026 applies to third-party developers, not private ones.
   1. Seller Central > Apps and Services > Develop Apps. Register as a private developer.
   2. Roles: Product Listing; Pricing; Inventory and Order Tracking; Amazon Fulfillment if you use FBA. Add Direct-to-Consumer Shipping if you want buyer names and full addresses on imported orders.
   3. Add an app client (API type: SP API) and copy the LWA Client ID and Client Secret.
   4. Click Authorize to self-authorize the app, then copy the refresh token.
   5. Find your Seller ID (Merchant Token) under Settings > Account Info.
3. In WordPress, go to Amazon > Settings, choose your marketplace, paste the credentials, save, and click "Test connection".

== Frequently Asked Questions ==

= Why are some imported orders missing the buyer's name and street address? =

Amazon only shares personal data with apps that have the Direct-to-Consumer Shipping role. Without it, orders import with city, state and postcode only.

= My new product listing shows errors =

Each Amazon product type requires different attributes. Click "Check with Amazon" on the product's Amazon tab to see what is missing. Then add the attributes as JSON in "More Amazon attributes", for example `{"manufacturer": [{"value": "Acme", "language_tag": "en_US"}]}`.

= Scheduled research runs late =

WordPress cron runs when someone visits your site. On quiet sites, add a real server cron job that requests `wp-cron.php` every few minutes.

= Where are the logs? =

WooCommerce > Status > Logs, source `open-lister-amazon`. Turn on "Log every Amazon request" in Settings for full detail.

== Changelog ==

= 1.0.0 =
* First release: listings, price and stock sync, order import, shipment confirmation, and product research with scheduled runs and similar-category ideas.
