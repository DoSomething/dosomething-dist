<?php
/**
 * Returns the HTML for a Campaign SMS Game.
 *
 * Available Variables
 * - $fact_problem:
 * - $end_date: End date for the campaign (string).
 * - $scholarship: Scholarship amount (string).
 * - $classes: Additional classes passed for output (string).
 */
?>

<article id="" class="">
  <header role="banner" class="-hero <?php print $classes; ?>">
    <div class="wrapper">
      <h1 class="__title"><?php print $title; ?></h1>
      <h2 class="__subtitle"><?php print $cta; ?></h2>

      <?php if (isset($end_date)): ?><p class="__date"><?php print $end_date; ?></p><?php endif; ?>

      <?php if (isset($sponsors[0]['display'])): ?>
      <div class="sponsor">
        <p class="__copy">Powered by</p>
        <?php foreach ($sponsors as $key => $sponsor) :?>
          <?php if (isset($sponsor['display'])): print $sponsor['display']; endif; ?>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>

      <?php if (isset($scholarship)): ?>
      <div class="scholarship-callout -action -above">
        <p class="copy"><?php print $scholarship; ?></p>
      </div>
      <?php endif; ?>
    </div>
  </header>


  <section id="know" class="container know">
    <h2 class="container__title banner"><span>Step 1: Know It</span></h2>

    <div class="wrapper">
      <div class="container__body">

        <h4 class="inline--alt-color">The Problem</h4>
        <?php if (isset($fact_problem)): ?>
        <div class="fact-problem">
          <?php print $fact_problem['fact']; ?><sup><?php print $fact_problem['footnotes']; ?></sup>
        </div>
        <?php endif; ?>

        <?php if (isset($psa)): ?>
          <div class="psa-wrapper"><?php print $psa; ?></div>
        <?php endif; ?>

        <?php if (!isset($psa)): ?>
          <?php print $modals; ?>
        <?php endif; ?>

      </div>

      <h4 class="inline--alt-color">The Solution</h4>

      <?php if (isset($fact_solution)): ?>
        <div class="fact-solution"><?php print $fact_solution['fact']; ?><sup><?php print $fact_solution['footnotes']; ?></sup></div>
      <?php elseif (isset($solution_copy)): ?>
        <div class="solution-copy"><?php print $solution_copy['safe_value']; ?></div>
      <?php endif; ?>

      <?php if (isset($solution_support)): ?>
      <div class="solution-supporting-copy"><?php print $solution_support; ?></div>
      <?php endif; ?>

      <?php if (isset($psa)): ?>
        <?php print $modals; ?>
      <?php endif; ?>

      <?php if (isset($fact_sources)): ?>
      <a href="#" class="js-toggle-sources secondary">Sources</a>
      <div class="sources">
        <div class="legal">
          <?php foreach ($fact_sources as $key => $source): ?>
            <div><sup><?php print ($key + 1); ?></sup> <?php print $source; ?></div>
          <?php endforeach; ?>
        </div>
      </div>
      <?php endif; ?>
    </div>

  </section>

  <section id="plan" class="container plan">
    <h2 class="container__title banner"><span>Step 2: Share It</span></h2>

    <div class="wrapper">
      <?php if (isset($starter)) : ?>
        <div><?php print $starter['safe_value']; ?></div>
      <?php endif; ?>
      <div>
        <?php print render($signup_form); ?>
      </div>
    </div>
  </section>

  <?php if (isset($zendesk_form) || isset($sponsors)): ?>
  <footer class="info-bar">
    <div class="wrapper">

      <?php if (isset($zendesk_form)): ?>
      <div class="help">
        Questions? <a href="#modal-contact-form" class="js-modal-link">Contact Us</a>
        <script id="modal-contact-form" class="modal--contact" type="text/cached-modal" data-modal-close="true" data-modal-close-class="white">
          <h2 class="banner">Contact Us</h2>
          <p>Enter your question below. Please be as specific as possible.</p>
          <?php print render($zendesk_form); ?>
        </script>
      </div>
      <?php endif; ?>

      <?php if (isset($sponsors)): ?>
        <div class="sponsor">
          In partnership with <?php print $formatted_partners; ?>
        </div>
      <?php endif; ?>
    </div>
  </footer>
  <?php endif; ?>

</article>
