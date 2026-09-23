<?php get_header(); ?>
<main id="main">
<section class="page-hero">
  <img class="page-hero-bg" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&amp;fit=crop&amp;w=1920&amp;q=72" srcset="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&amp;fit=crop&amp;w=768&amp;q=72 768w, https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&amp;fit=crop&amp;w=1280&amp;q=72 1280w, https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&amp;fit=crop&amp;w=1920&amp;q=72 1920w, https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&amp;fit=crop&amp;w=2560&amp;q=72 2560w" sizes="100vw" alt="Colleagues taking notes around a meeting table" loading="eager" fetchpriority="high">
  <div class="wrap">
    <nav class="breadcrumb"><a href="<?php echo esc_url(home_url("/")); ?>">Home</a> / <a href="<?php echo esc_url(home_url("/get-in-touch/")); ?>">Get In Touch</a></nav>
    <span class="eyebrow eyebrow--light">Contact Us</span>
    <h1>Ready to Get Started? Talk to an EnVue Fleet Expert.</h1>
    <p>Contact EnVue Telematics for a free fleet assessment and demo. Our fleet management experts are ready to learn about your operation, identify your highest-impact opportunities, and build a solution configured for your specific fleet and goals.</p>
    <div class="hero-actions">
      <a class="button button-primary button-lg" href="tel:8002011169">Call (800) 201-1169</a>
      <a class="button button-ghost button-lg" href="mailto:sales@et-envue.com">Email Us</a>
    </div>
  </div>
</section>

<?php
// Contact form schema
$contact_schema = array(
    "@context" => "https://schema.org",
    "@type" => "ContactPage",
    "name" => "Contact EnVue Telematics",
    "description" => "Contact EnVue Telematics for a free fleet management assessment and demo. Geotab Elite Specialized Partner serving commercial fleets across the United States and Mexico.",
    "url" => home_url("/get-in-touch/"),
    "mainEntity" => array(
        "@type" => "LocalBusiness",
        "@id" => home_url("/#organization"),
        "name" => "EnVue Telematics",
        "telephone" => "+18002011169",
        "email" => "sales@et-envue.com",
        "address" => array(
            "@type" => "PostalAddress",
            "streetAddress" => "119 West Tyler Street, Suite 100",
            "addressLocality" => "Longview",
            "addressRegion" => "TX",
            "postalCode" => "75601",
            "addressCountry" => "US"
        )
    )
);
echo "<script type='application/ld+json'>" . json_encode($contact_schema, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "</script>";
?>

<section class="section"><div class="wrap">
  <div class="section-head"><div>
    <span class="eyebrow reveal">Contact EnVue</span>
    <h2 class="reveal" style="--d:1">We are ready to help you build a smarter fleet program.</h2>
  </div><div class="reveal" style="--d:2">
    <p>Whether you are evaluating GPS fleet tracking for the first time, replacing an underperforming telematics provider, or adding AI dash cams and compliance tools to an existing Geotab deployment, EnVue Telematics has the expertise to build the right program for your fleet. Call us, email us, or submit the contact form and we will be in touch within one business day.</p>
  </div></div>

  <div class="feature-split">

    <?php /* ── Contact Form ─────────────────────────────── */ ?>
    <div class="reveal">
      <span class="eyebrow">Request a Free Fleet Assessment</span>
      <h2>Tell us about your fleet — we&rsquo;ll do the rest.</h2>

      <p>Whether you have questions, need a quote or a free demo of our products, or require support, we&rsquo;re here to assist you. Let EnVue be your strategic partner! We&rsquo;ll empower you to optimize your fleet and drive costs down with advanced telematics. Fill out this form to get a complimentary demo.</p>

      <?php echo do_shortcode('[wpforms id="2958" title="false"]'); ?>

      <p class="git-sms-consent">By providing my phone number to EnVue Telematics, I agree and acknowledge that EnVue Telematics may send text messages to my wireless phone number for any purpose. Message and data rates may apply. We will only send one SMS as a reply to you, and you will be able to Opt-out by replying &ldquo;STOP&rdquo;. For more information on how your data will be handled please visit our <a href="<?php echo esc_url(home_url('/privacy-policy/')); ?>">Privacy Policy</a>.</p>
    </div>

    <?php /* ── Contact Details ─────────────────────────── */ ?>
    <div class="feature-split-media">
      <div style="background:#f8f9fb;border-radius:12px;padding:2.5rem;height:100%;display:flex;flex-direction:column;gap:1.75rem;">
        <div>
          <strong style="display:block;font-size:0.8125rem;text-transform:uppercase;letter-spacing:.08em;color:var(--c-brand,#0a2e6e);margin-bottom:.5rem;">Phone</strong>
          <a href="tel:8002011169" style="font-size:1.5rem;font-weight:700;color:inherit;text-decoration:none;">(800) 201-1169</a>
          <p style="margin:.25rem 0 0;color:#555;font-size:.9375rem;">US-based support available 24/7</p>
        </div>
        <div>
          <strong style="display:block;font-size:0.8125rem;text-transform:uppercase;letter-spacing:.08em;color:var(--c-brand,#0a2e6e);margin-bottom:.5rem;">Sales</strong>
          <a href="mailto:sales@et-envue.com" style="font-size:1.0625rem;font-weight:600;color:inherit;text-decoration:none;">sales@et-envue.com</a>
          <p style="margin:.25rem 0 0;color:#555;font-size:.9375rem;">We respond within one business day</p>
        </div>
        <div>
          <strong style="display:block;font-size:0.8125rem;text-transform:uppercase;letter-spacing:.08em;color:var(--c-brand,#0a2e6e);margin-bottom:.5rem;">Support</strong>
          <a href="mailto:support@et-envue.com" style="font-size:1.0625rem;font-weight:600;color:inherit;text-decoration:none;">support@et-envue.com</a>
          <p style="margin:.25rem 0 0;color:#555;font-size:.9375rem;">Existing customers: technical and account support</p>
        </div>
        <div>
          <strong style="display:block;font-size:0.8125rem;text-transform:uppercase;letter-spacing:.08em;color:var(--c-brand,#0a2e6e);margin-bottom:.5rem;">Office</strong>
          <address style="font-style:normal;line-height:1.7;font-size:.9375rem;">119 West Tyler Street<br>Suite 100<br>Longview, Texas 75601</address>
        </div>
        <div>
          <strong style="display:block;font-size:0.8125rem;text-transform:uppercase;letter-spacing:.08em;color:var(--c-brand,#0a2e6e);margin-bottom:.5rem;">Partners</strong>
          <a href="<?php echo esc_url(home_url('/our-partners/')); ?>" style="font-size:1.0625rem;font-weight:600;color:inherit;">Become a partner &rarr;</a>
        </div>
        <div style="padding:1.25rem;background:var(--c-brand,#0a2e6e);border-radius:8px;color:#fff;margin-top:auto;">
          <p style="margin:0 0 .75rem;font-size:.9375rem;font-weight:600;">Prefer to call? Our experts are standing by.</p>
          <a href="tel:8002011169" style="color:#fff;font-weight:700;text-decoration:none;font-size:1.0625rem;">(800) 201-1169 &rarr;</a>
        </div>
      </div>
    </div>

  </div>
</div></section>

<style>
.git-sms-consent{margin-top:1.25rem;font-size:.8125rem;line-height:1.6;color:var(--slate);}
.git-offices{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px;}
.git-office{background:#fff;border:1px solid var(--line);border-radius:var(--r-lg);overflow:hidden;}
.git-office > img{width:100%;height:200px;object-fit:cover;display:block;}
.git-office-body{padding:24px 28px 28px;}
.git-office-body h3{font-size:1.125rem;margin-bottom:.75rem;}
.git-office-body address{font-style:normal;line-height:1.7;color:var(--slate);font-size:.9375rem;}
.git-office-body a{font-weight:700;color:inherit;text-decoration:none;}
@media(max-width:760px){.git-offices{grid-template-columns:1fr;}}
</style>
<section class="section section--soft" id="offices"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Our Global Offices</span>
    <h2 class="reveal" style="--d:1">Teams in the United States and Mexico.</h2>
    <p class="reveal" style="--d:2">Reach out to members of our dedicated teams in the United States and Mexico.</p>
  </div></div>
  <div class="git-offices">
    <div class="git-office reveal">
      <?php echo envue_office_flag( 'us', 'U.S. Headquarters', 'Longview, Texas' ); ?>
      <div class="git-office-body">
        <h3>EnVue Telematics (U.S. HQ)</h3>
        <address>119 West Tyler Street<br>Suite 100<br>Longview, Texas 75601<br>United States</address>
        <p style="margin-top:.75rem"><a href="tel:8002011169">(800) 201-1169</a></p>
      </div>
    </div>
    <div class="git-office reveal" style="--d:1">
      <?php echo envue_office_flag( 'mx', 'Mexico Operations', 'Monterrey, Nuevo León' ); ?>
      <div class="git-office-body">
        <h3>EnVueMex Solutions (Mexico)</h3>
        <address>Blvd. D&iacute;az Ordaz 3102, Piso 2<br>Santa Mar&iacute;a, 64650 Monterrey, N.L.<br>Mexico</address>
        <p style="margin-top:.75rem"><a href="tel:+528121880258">81-2188-0258</a></p>
      </div>
    </div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <div class="section-head section-head--center"><div>
    <span class="eyebrow reveal">Why Contact EnVue</span>
    <h2 class="reveal" style="--d:1">What you get from working with the Geotab Elite Specialized Partner.</h2>
  </div></div>
  <ul class="check-list check-list--2col reveal">
    <li><strong>No-pressure assessment</strong> &mdash; A real conversation about your fleet, not a scripted sales presentation</li>
    <li><strong>Expert recommendation</strong> &mdash; Solution designed for your specific fleet, not a standard package</li>
    <li><strong>Geotab Elite expertise</strong> &mdash; Highest channel certification reflects proven deployment excellence</li>
    <li><strong>Full platform demo</strong> &mdash; See exactly how your fleet management program will work before committing</li>
    <li><strong>ROI modeling</strong> &mdash; We model expected results based on your fleet size and operational profile</li>
    <li><strong>Fast timeline</strong> &mdash; Most deployments complete within 2-4 weeks of contract execution</li>
    <li><strong>Post-deployment accountability</strong> &mdash; Quarterly reviews keep us responsible for your outcomes</li>
    <li><strong>24/7 US-based support</strong> &mdash; Real people who know your fleet, available any time</li>
  </ul>
</div></section>

<?php
echo envue_faq_section([
    'What should I expect from my first call with EnVue Telematics?' => '<p>Your first call with EnVue Telematics is a fleet discovery conversation — not a sales call. We want to understand your vehicle types, how they are operated, your current challenges, compliance requirements, and cost priorities. Based on this conversation, we design a specific solution recommendation and schedule a demo. The call typically runs 45-60 minutes.</p>',
    'How quickly can EnVue deploy fleet telematics?' => '<p>Most EnVue fleet telematics deployments are complete within 2-4 weeks from contract execution through device installation, platform configuration, and driver and manager training. The timeline depends on fleet size, number of locations, and solution complexity. EnVue provides a specific deployment timeline during the solution design phase before any commitment.</p>',
    'Does EnVue work with my existing fleet management software?' => '<p>Geotab integrates with hundreds of third-party platforms through the Geotab Marketplace and open API. EnVue evaluates your existing software during discovery and designs integration where it is available and beneficial. Common integrations include ERP systems, dispatch platforms, fuel card providers, maintenance management software, and payroll systems.</p>',
    'Is there a contract commitment for EnVue fleet management?' => '<p>Contact EnVue Telematics at (800) 201-1169 or sales@et-envue.com to discuss contract terms for your specific deployment. EnVue offers standard subscription terms aligned with typical fleet management investment horizons.</p>',
    'Does EnVue provide fleet management for Mexico operations?' => '<p>Yes. EnVue Mexico provides Geotab-powered fleet management for commercial operations in Mexico, with Spanish-language support and the same solutions available in the United States. Our Mexico office, EnVueMex Solutions, is located at Blvd. D&iacute;az Ordaz 3102, Piso 2, Santa Mar&iacute;a, 64650 Monterrey, N.L., and can be reached at 81-2188-0258. Contact EnVue to discuss fleet management for cross-border or Mexico-based operations.</p>',
    'How do I reach EnVue customer support after deployment?' => '<p>EnVue provides 24/7 US-based support available by phone at (800) 201-1169 and by email at support@et-envue.com for all fleet management support needs after deployment.</p>'
], 'FAQ: Contact and Getting Started');
?>

</main>
<section class="final-cta" id="demo"><div class="wrap final-grid">
  <div><span class="eyebrow eyebrow--light">EnVue Telematics</span><h2>Start your free fleet assessment today.</h2></div>
  <div><p>Call (800) 201-1169 or email sales@et-envue.com. Our fleet management experts are ready to learn about your operation and design a program that delivers measurable results.</p>
  <div class="hero-actions">
    <a class="button button-primary button-lg" href="tel:8002011169">Call (800) 201-1169</a>
    <a class="button button-ghost button-lg" href="mailto:sales@et-envue.com">Email Us</a>
  </div></div>
</div></section>
<?php get_footer(); ?>