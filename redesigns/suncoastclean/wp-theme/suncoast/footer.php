</main>

<footer class="site">
  <div class="wrap">
    <div class="cols">
      <div>
        <?php echo suncoast_brand( true ); // phpcs:ignore ?>
        <p>Carpet, upholstery, tile and grout, area rug and water damage cleaning in Jupiter and the Palm Beaches since 1988.</p>
        <div class="social">
          <?php if ( suncoast_option( 'facebook' ) ) : ?><a href="<?php echo esc_url( suncoast_option( 'facebook' ) ); ?>" target="_blank" rel="noopener" aria-label="Facebook"><svg><use href="#fb"/></svg></a><?php endif; ?>
          <?php if ( suncoast_option( 'twitter' ) ) : ?><a href="<?php echo esc_url( suncoast_option( 'twitter' ) ); ?>" target="_blank" rel="noopener" aria-label="Twitter"><svg><use href="#tw"/></svg></a><?php endif; ?>
        </div>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li><a href="tel:<?php echo esc_attr( suncoast_option( 'phone_tel' ) ); ?>"><?php echo esc_html( suncoast_option( 'phone' ) ); ?></a></li>
          <li><a href="sms:<?php echo esc_attr( suncoast_option( 'phone_tel' ) ); ?>">Text us</a></li>
          <li><a href="mailto:<?php echo esc_attr( suncoast_option( 'email' ) ); ?>"><?php echo esc_html( suncoast_option( 'email' ) ); ?></a></li>
          <li><?php echo esc_html( suncoast_option( 'address' ) ); ?></li>
        </ul>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
          <?php foreach ( suncoast_services() as $slug => $label ) : ?>
          <li><a href="<?php echo esc_url( suncoast_url( $slug ) ); ?>"><?php echo esc_html( $label ); ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <?php
        if ( has_nav_menu( 'company' ) ) {
          wp_nav_menu( array( 'theme_location' => 'company', 'container' => false, 'depth' => 1 ) );
        } else {
          ?>
        <ul>
          <li><a href="<?php echo esc_url( suncoast_url( 'about-suncoast-carpet-cleaning' ) ); ?>">About Us</a></li>
          <li><a href="<?php echo esc_url( suncoast_url( 'locations' ) ); ?>">Locations</a></li>
          <li><a href="<?php echo esc_url( suncoast_url( 'news' ) ); ?>">News</a></li>
          <li><a href="<?php echo esc_url( suncoast_url( 'get-that-stain-out' ) ); ?>">Get That Stain Out!</a></li>
          <li><a href="<?php echo esc_url( suncoast_url( 'contact-us' ) ); ?>">Contact Us</a></li>
          <li><a href="<?php echo esc_url( suncoast_url( 'privacy' ) ); ?>">Privacy</a></li>
        </ul>
          <?php
        }
        ?>
      </div>
    </div>
    <div class="legal">
      <span>Copyright © <?php echo esc_html( gmdate( 'Y' ) ); ?> Sun Coast Cleaning and Restoration | All Rights Reserved</span>
      <span>License #1988-09231 · IICRC certified firm · BBB member since 1993</span>
    </div>
  </div>
</footer>

<div class="callbar">
  <a class="btn btn-sun" href="tel:<?php echo esc_attr( suncoast_option( 'phone_tel' ) ); ?>"><svg aria-hidden="true"><use href="#phone"/></svg>Call</a>
  <a class="btn btn-ghost" style="border-color:rgba(255,255,255,.5);color:#fff" href="#estimate">Free estimate</a>
</div>

<?php wp_footer(); ?>
</body>
</html>
