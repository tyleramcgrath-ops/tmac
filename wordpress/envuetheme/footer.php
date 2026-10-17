<!-- ── FOOTER ────────────────────────────────────────────────── -->
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <img src="<?php echo get_template_directory_uri(); ?>/assets/images/envue-logo.png" alt="EnVue Telematics" width="200" height="58" loading="lazy">
      <p>AI-powered fleet intelligence for operations leaders who need safety, efficiency and measurable ROI from every vehicle in the fleet.</p>
      <?php echo envue_social_links( 'social-links--footer' ); ?>
    </div>
    <div>
      <h3>Solutions</h3>
      <a href="<?php echo esc_url(home_url('/dash-cams/')); ?>">AI Dash Cams</a>
      <a href="<?php echo esc_url(home_url('/gps-tracking/')); ?>">GPS Tracking</a>
      <a href="<?php echo esc_url(home_url('/equipment-management/')); ?>">Equipment &amp; Assets</a>
      <a href="<?php echo esc_url(home_url('/fuel-management/')); ?>">Fuel Management</a>
      <a href="<?php echo esc_url(home_url('/powered-by-geotab/')); ?>">Powered by Geotab</a>
    </div>
    <div>
      <h3>Industries</h3>
      <a href="<?php echo esc_url(home_url('/trucking-transportation/')); ?>">Trucking</a>
      <a href="<?php echo esc_url(home_url('/construction/')); ?>">Construction</a>
      <a href="<?php echo esc_url(home_url('/field-services/')); ?>">Field Services</a>
      <a href="<?php echo esc_url(home_url('/oil-gas/')); ?>">Oil &amp; Gas</a>
      <a href="<?php echo esc_url(home_url('/government/')); ?>">Government</a>
      <a href="<?php echo esc_url(home_url('/leasing-rental/')); ?>">Leasing &amp; Rental</a>
    </div>
    <div>
      <h3>Company</h3>
      <a href="<?php echo esc_url(home_url('/about-envue/')); ?>">About EnVue</a>
      <a href="<?php echo esc_url(home_url('/our-partners/')); ?>">Our Partners</a>
      <a href="<?php echo esc_url(home_url('/resources/')); ?>">Resources</a>
      <a href="<?php echo esc_url(home_url('/news/')); ?>">News</a>
      <a href="<?php echo esc_url(home_url('/events-calendar/')); ?>">Events</a>
      <a href="<?php echo esc_url(home_url('/get-in-touch/')); ?>">Contact</a>
      <a href="tel:8002011169">(800) 201-1169</a>
      <a href="mailto:sales@et-envue.com">sales@et-envue.com</a>
      <a href="mailto:support@et-envue.com">support@et-envue.com</a>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <span>&copy; <?php echo date('Y'); ?> EnVue Telematics. All rights reserved.</span>
    <span>119 West Tyler Street, Suite 100 &middot; Longview, Texas 75601</span>
    <span class="footer-legal"><a href="<?php echo esc_url(home_url('/privacy-policy/')); ?>">Privacy Policy</a> &middot; <a href="<?php echo esc_url(home_url('/cookie-policy/')); ?>">Cookie Policy</a></span>
  </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
