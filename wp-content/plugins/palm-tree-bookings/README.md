# Palm Tree Bookings

Booking requests for surf lessons, tours and custom experiences: capture, manage, notify, quote and
export. Built as a plugin rather than theme code so booking data survives a theme change, and so the
theme itself stays plugin-free.

## What it does today

- **Captures a full surf booking.** Experience, preferred and alternate date, time of day, party
  size, skill level, per-surfer name/age/height/weight for board and wetsuit sizing, medical notes,
  accommodation and hotel pickup, arrival and departure dates, contact details and preferred contact
  method, how they heard about you, and free-text requests.
- **Manages them in wp-admin.** One screen per booking, a filterable list, and a five-step workflow:
  New → Contacted → Confirmed → Completed / Cancelled. Internal-only fields for assigned instructor,
  quoted price and private notes.
- **Emails both sides.** A full summary to you with a one-click link to the booking, and an optional
  copy to the customer.
- **Quotes and deposits.** Every booking gets a calculated quote and deposit the moment it arrives.
- **Exports to CSV**, every field, UTF-8 BOM so Excel opens it correctly.
- **Attributes bookings.** Records which page and which CTA section produced the booking, plus UTM
  parameters, so you can see what actually converts.

## Scheduling and availability

Each experience carries its own schedule, edited on the experience itself under
**Availability & Schedule**:

- **Days it runs** and **start times** (one per line, 24-hour). Leave times empty for an all-day
  excursion with no set start.
- **Guests per slot** — capacity at one start time.
- **Minimum notice** — slots closer than this stop being offered.
- **Bookable how far ahead** — the booking horizon.
- **Season** — a month-day range that may cross the new year.
- **Blackout dates** — closures, holidays, maintenance.

The box previews the next open dates so a misconfiguration is visible before anyone tries to book.

**Bookings consume capacity.** The booking form only offers dates and times that are actually open,
and a slot disappears once it fills. Cancelling a booking releases its seats. Capacity is re-checked
server-side at submission against live counts, so two people filling the form at the same moment
cannot both take the final seat — the second gets told the slot just went.

**Bookings → Schedule** shows what is actually happening day by day: time, experience, customer,
guest count and status, for the next 7 / 14 / 30 / 90 days. Cancelled bookings drop out.

The picker is progressive enhancement. With JavaScript off the time select stays empty, the booking
is still accepted, and staff confirm the time by reply.

## What it does not do yet

**No online card payment** until a gateway is added (see below). Customers request and you confirm;
availability and capacity are enforced, but money is collected by you.

## Spam handling

Three layers, no CAPTCHA: a honeypot field hidden with CSS positioning rather than `display: none`,
a submit-timestamp check that rejects sub-three-second submissions, and a one-minute per-IP throttle.
The form uses post/redirect/get, so a refresh never resubmits, and entered values survive a
validation error.

## Usage

Put the form anywhere with the shortcode:

```
[palm_tree_booking_form]
```

Pre-select an experience and label the CTA source for attribution:

```
[palm_tree_booking_form experience="42" location="experience-sticky-card"]
```

Or call it from a template:

```php
echo ptb_render_form( array( 'experience' => get_the_ID(), 'location' => 'experience-single' ) );
```

The experience picker reads the `experience` post type when the theme provides one, and falls back
to a plain text field when it does not. Point it elsewhere with the `ptb_experience_post_type`
filter.

## Adding payments later

This is the part the plugin is built around. Money is modelled from day one — amounts are stored in
**minor units as integers**, never floats — and the pieces a gateway needs already exist and are
live:

| Piece | Status |
| --- | --- |
| Availability, capacity and schedules | Working |
| Quote and deposit per booking | Calculated on every booking now |
| Payment ledger, idempotent on gateway reference | Working; manual payments log through it |
| Payment status, separate from booking status | Working |
| Tokenised customer pay link | Generated; returns a clear "not set up yet" page until a gateway exists |
| Webhook endpoint | Live at `/wp-json/ptb/v1/webhook/<gateway>` |
| Gateway registry and base class | `PTB_Gateway` + `ptb_register_gateway()` |

Adding Stripe means writing one class. Nothing in this plugin changes.

```php
class My_Stripe_Gateway extends PTB_Gateway {

	public function get_id() {
		return 'stripe';
	}

	public function get_label() {
		return 'Stripe';
	}

	public function is_configured() {
		return (bool) get_option( 'my_stripe_secret_key' );
	}

	public function create_checkout( $booking_id, $amount ) {
		// $amount is already in minor units. Create a Checkout Session and
		// return its URL, or a WP_Error.
		return 'https://checkout.stripe.com/c/pay/...';
	}

	public function handle_webhook( $request ) {
		// Verify the Stripe signature FIRST. Then:
		ptb_record_payment(
			$booking_id,
			array(
				'amount'    => $amount_in_cents,
				'gateway'   => 'stripe',
				'reference' => $payment_intent_id, // Makes replays harmless.
			)
		);

		return new WP_REST_Response( array( 'received' => true ), 200 );
	}
}

add_action( 'plugins_loaded', function () {
	ptb_register_gateway( new My_Stripe_Gateway() );
} );
```

Once registered and configured, the pay link starts working, the admin shows it, and
`ptb_record_payment()` keeps the balance and payment status correct — including partial deposits and
refunds. `reference` makes webhook replays a no-op, which is what stops double-counting.

The same shape works for PayPal, Mercado Pago, or a local Costa Rican processor. Nothing about the
interface is Stripe-specific.

## Hooks

| Hook | Type | Purpose |
| --- | --- | --- |
| `ptb_field_groups` | filter | Add, remove or reorder customer-facing fields |
| `ptb_experience_post_type` | filter | Point the experience picker at a different post type |
| `ptb_blocking_statuses` | filter | Which booking statuses hold a seat |
| `ptb_quote` | filter | Replace quote maths with real pricing rules |
| `ptb_deposit` | filter | Replace deposit maths |
| `ptb_currency` | filter | Override the currency |
| `ptb_gateways` | filter | Register gateways |
| `ptb_booking_created` | action | Fires after a booking is stored and emails are sent |
| `ptb_payment_recorded` | action | Fires after a payment lands and totals update |

## Settings

**Bookings → Settings**: notification address, reply-from name, on-screen confirmation text, whether
to email the customer, WhatsApp number, currency, deposit percentage, and gateway selection.

## Data model

Bookings are a private post type (`ptb_booking`) — not public, not searchable, not in the REST API,
and not creatable by hand in wp-admin. All fields are post meta prefixed `_ptb_`. The payment ledger
is a single `_ptb_payment_log` array.

One schema in `inc/schema.php` drives the public form, the admin screen, the emails and the CSV
export. Add a field there and it appears in all four.

## Requirements

WordPress 6.0+, PHP 7.4+. No other plugins required.
