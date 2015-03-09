<?php
/**
 * Returns the HTML for the Campaign Pitch page.
 *
 * Available Variables
 * - $campaign: A campaign object. @see dosomething_campaign_load()
 * - $classes: Additional classes passed for output (string).
 * - $campaign_scholarship: Scholarship amount (string).
 */
?>

<section class="campaign campaign--pitch pitch">

  <header role="banner" class="header -hero <?php print $classes; ?>">
    <div class="wrapper">
      <?php print $campaign_headings; ?>

      <?php if (isset($signup_button_primary)): ?>
        <div class="header__signup">
          <?php print render($signup_button_primary); ?>
          <?php print $campaign_scholarship; ?>
        </div>
      <?php endif; ?>

      <?php print $promotions; ?>
    </div>
  </header>

  <?php if (isset($campaign->value_proposition)): ?>
    <div class="container">
      <div class="wrapper">
        <div class="container__block -half">
          <h3><?php print t('The Problem'); ?></h3>
          <p><?php print $campaign->fact_problem['fact']; ?></p>

          <h3><?php print t('The Solution'); ?></h3>
          <?php // @TODO: DRY this logic with action page via $campaign ?>
          <?php if (isset($campaign->fact_solution)): ?>
            <p><?php print $campaign->fact_solution['fact']; ?></p>
          <?php elseif (isset($campaign->solution_copy)): ?>
            <?php print $campaign->solution_copy; ?>
          <?php endif; ?>

          <?php if (isset($campaign->solution_support)): ?>
            <?php print $campaign->solution_support; ?>
          <?php endif; ?>
        </div>

        <div class="container__block -half">
          <h3><?php print t('What You Get'); ?></h3>
          <p><?php print $campaign->value_proposition; ?></p>
        </div>
      </div>
    </div>
  <?php endif; ?>

  <?php if (isset($campaign->secondary_call_to_action)): ?>
    <div class="cta">
      <div class="wrapper">
        <h2 class="cta__message"><?php print $campaign->secondary_call_to_action; ?></h2>
        <?php if (isset($signup_button_secondary)): ?>
          <?php print render($signup_button_secondary); ?>
        <?php endif; ?>
      </div>
    </div>
  <?php endif; ?>

  <div class="info-bar -dark">
    <div class="wrapper">
      <?php print $tagline; ?>
      <em><?php print t('*mic drop'); ?></em>
    </div>
  </div>

</section>
