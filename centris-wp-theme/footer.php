<?php
/**
 * Footer — closes main, renders site footer, and emits wp_footer.
 */
?>
</main>

<footer>
    <div class="wrap">
        <div class="foot-grid">
            <div class="foot-brand">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="brand">Centris<span class="dot">.</span></a>
                <p>Centris Information Services — bilingual nearshore contact center solutions, built for a human-first AI future.</p>
                <div class="foot-socials">
                    <a href="https://facebook.com/centrisinfo" aria-label="Facebook">
                        <svg class="ico-svg" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                    <a href="https://linkedin.com/company/centris-information-services" aria-label="LinkedIn">
                        <svg class="ico-svg" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    </a>
                    <a href="https://x.com/centrisinfo" aria-label="X">
                        <svg class="ico-svg" viewBox="0 0 24 24"><path d="M18 4 6 20M6 4l12 16"/></svg>
                    </a>
                </div>
            </div>

            <div class="foot-col">
                <h6>Sitemap</h6>
                <ul>
                    <li><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/about' ) ); ?>">About</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/services' ) ); ?>">Services</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/industries' ) ); ?>">Industries</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/case-studies' ) ); ?>">Case Studies</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/resources' ) ); ?>">Resources</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/contact' ) ); ?>">Contact</a></li>
                </ul>
            </div>

            <div class="foot-col">
                <h6>Services</h6>
                <ul>
                    <li><a href="<?php echo esc_url( home_url( '/service-ai-call-center' ) ); ?>">AI Call Center</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/service-customer-support' ) ); ?>">Customer Support</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/service-bpo' ) ); ?>">BPO</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/service-inbound-sales' ) ); ?>">Inbound Sales</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/service-live-chat' ) ); ?>">Live Chat</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/service-marketing-surveys' ) ); ?>">Marketing Surveys</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/service-quality-assurance' ) ); ?>">Quality Assurance</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/service-soft-collections' ) ); ?>">Soft Collections</a></li>
                    <li><a href="<?php echo esc_url( home_url( '/service-tier-1-tech' ) ); ?>">Tier 1 Tech Support</a></li>
                </ul>
            </div>

            <div class="foot-col">
                <h6>Connect With Us</h6>
                <div class="contact-info">
                    <div>
                        <span class="ico"><svg class="ico-svg" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span>
                        <p>1-800-530-4897</p>
                    </div>
                    <div>
                        <span class="ico"><svg class="ico-svg" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                        <p>kudos@centrisinfo.com</p>
                    </div>
                    <div>
                        <span class="ico"><svg class="ico-svg" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                        <p>119 W. Tyler St., Suite 260<br/>Longview, TX 75601</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="foot-bottom">
            © <?php echo esc_html( date( 'Y' ) ); ?> Centris Information Services. All rights reserved.
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
