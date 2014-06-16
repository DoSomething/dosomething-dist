<?php
/**
 * Returns the HTML for the Campaign Closed page.
 *
 * Available Variables
 * - $title: Title for the campaign closed page (string).
 * - $cta: Call To Action for the campaign closed page (string).
 * - $classes: Additional classes passed for output (string).
 * - $scholarship: Scholarship amount (string).
 * - $sponsors: List of sponsors (array).
 * - $total_participants: Number of members participated (string).
 * - $total_quantity: Total quantity of campaign items (string).
 * - $total_quantity_label: Label for the campign items donated (string).
 * - $intro: Intro copy for campaign closed page (string).
 * - $reportback_gallery: Galleries for 'What You Did' (array).
 */
?>

<article class="campaign closed">

  <header role="banner" class="-hero <?php print $classes; ?>">
    <div class="wrapper">
      <h1 class="__title"><?php print $title; ?></h1>
      <h2 class="__subtitle"><?php print $cta; ?></h2>

      <?php if (isset($end_date)): ?><p class="__date"><?php print $end_date; ?></p><?php endif; ?>

      <?php if (isset($signup_button)): ?>
        <div class="__signup">
          <?php print render($signup_button); ?>

          <?php if (isset($scholarship)): ?>
          <div class="scholarship-callout -below -pitch">
            <p class="copy"><?php print $scholarship; ?></p>
          </div>
          <?php endif; ?>
        </div>
      <?php endif; ?>

      <?php if (isset($sponsors[0]['display'])): ?>
      <div class="sponsor">
        <p class="__copy">Powered by</p>
        <?php foreach ($sponsors as $key => $sponsor) :?>
          <?php if (isset($sponsor['display'])): print $sponsor['display']; endif; ?>
        <?php endforeach; ?>
      </div>
      <?php endif; ?>

    </div>
  </header>

  <?php // WHAT YOU DID ////////////////////////////////////////////////////// ?>
  <section class="container container--did">
    <h2 class="container__title banner"><span>What You Did</span></h2>

    <div class="wrapper">

      <div class="container__body">

        <?php // Campaign statistics ?>
        <div class="__row">
          <?php if (isset($total_participants)): ?>

            <?php // Number of members participated ?>
            <div class="statistic<?php if (isset($total_quantity)): ?> -columned -odd<?php endif; ?>">
              <p>
                <strong class="inline--alt-color"><?php print $total_participants; ?></strong>
                <em>members participated</em>
              </p>
            </div>

          <?php endif; ?>

          <?php if (isset($total_quantity_label)) : ?>
            <?php if (isset($total_quantity)): ?>

              <?php // Total quantity & label ?>
              <div class="statistic<?php if (isset($total_participants)): ?> -columned -even -col-last<?php endif; ?>">
                <p>
                  <strong class="inline--alt-color"><?php print $total_quantity; ?></strong>
                  <em><?php print $total_quantity_label; ?></em>
                </p>
              </div>

            <?php else: ?>

              <?php // Coming soon copy ?>

            <?php endif; ?>
          <?php endif; ?>
        </div>

        <?php // Intro copy ?>
        <?php if (isset($intro)): ?>
          <div class="intro">
            <p><?php print $intro['safe_value']; ?></p>
          </div>
        <?php endif; ?>

        <?php // Reportback gallery ?>
        <?php if (isset($reportback_gallery)): ?>
          <ul class="gallery -triad">
            <?php foreach ($reportback_gallery as $key => $reportback_gallery_item) :?>
              
              <li>
                <div class="tile tile--figure">
                  <?php if (isset($reportback_gallery_item['image'])): ?>
                    <?php print $reportback_gallery_item['image']; ?>
                  <?php endif; ?>
                  <?php if (isset($reportback_gallery_item['first_name'])): ?>
                    <h3 class="__title"><?php print $reportback_gallery_item['first_name']; ?></h3>
                  <?php endif; ?>
                  <?php if (isset($reportback_gallery_item['caption'])): ?>
                    <div class="__description"><?php print $reportback_gallery_item['caption']; ?></div>
                  <?php endif; ?>
                </div>
              </li>

            <?php endforeach; ?>
          </ul>
        <?php endif; ?>

      </div>
    </div>
  </section>

  <?php // LOVE FROM CELEBS ////////////////////////////////////////////////////// ?>
  <section class="container container--celebs">
    <h2 class="container__title banner"><span>Love From Celebs</span></h2>
    <div class="wrapper">

      <div class="container__body">

        <div class="__row">
          <div <?php if (isset($psa)): ?>class="-columned -odd"<?php endif; ?>>
            <?php if (isset($additional_text_title)): ?>
            <h4><?php print $additional_text_title; ?></h4>
            <?php endif; ?>

            <?php if (isset($additional_text)): ?>
            <div><?php print $additional_text['safe_value']; ?></div>
            <?php endif; ?>
          </div>

          <?php if (isset($psa)): ?>
            <aside class="-columned -col-last">
              <?php print $psa; ?>
            </aside>
          <?php endif; ?>
        </div>

        <?php foreach ($klout_gallery as $key => $klout_gallery_item) :?>

          <?php // Assign specific gallery css classes depending on 
                // the gallery type
                // If the gallery type is 'mention' then it will use the -duo pattern, 
                // else use -triad
          ?>

          <?php
            switch ($klout_gallery_item['type']) {
              case 'press':
                $modifer = '-triad';
                break;
              case 'mention':
                $modifer = '-duo';
                break;
              case 'action':
                $modifer = '-triad';
                break;
            }
            $modifer .= ' -' . $klout_gallery_item['type'];
          ?>

          <h3 class="inline--alt-color"><?php print $klout_gallery_item['title']; ?></h3>

          <?php // The klout galleries ?>
          <ul class="gallery <?php print $modifer ?>">
            <?php foreach ($klout_gallery_item['items'] as $key => $gallery_item) :?>

              <?php if ($klout_gallery_item['type'] === 'mention') : ?>
                <li>
                  <div class="tile tile--figure">
                    <?php if (isset($gallery_item['image'])): ?>
                      <?php print $gallery_item['image']; ?>
                    <?php endif; ?>

                    <div class="__body">
                      <?php if (isset($gallery_item['title'])): ?>
                        <h3 class="__title"><?php print $gallery_item['title']; ?></h3>
                      <?php endif; ?>
                      <?php if (isset($gallery_item['desc'])): ?>
                        <div class="__description"><?php print $gallery_item['desc']; ?></div>
                      <?php endif; ?>
                    </div>
                  </div>
                </li>
              <?php else: ?>
                <li>
                  <div class="tile tile--figure">
                    <?php if (isset($gallery_item['image'])): ?>
                      <?php print $gallery_item['image']; ?>
                    <?php endif; ?>
                    <?php if (isset($gallery_item['title'])): ?>
                      <h3 class="__title"><?php print $gallery_item['title']; ?></h3>
                    <?php endif; ?>
                    <?php if (isset($gallery_item['desc'])): ?>
                      <div class="__description"><?php print $gallery_item['desc']; ?></div>
                    <?php endif; ?>
                  </div>
                </li>
              <?php endif; ?>

            <?php endforeach; ?>

          </ul>

        <?php endforeach; ?>

      </div>

    </div>
  </section>

  <?php // CONGRATULATIONS TO... ////////////////////////////////////////////////////// ?>
  <section class="container container--congrats">
    <h2 class="container__title banner"><span>Congratulations to&hellip;</span></h2>
    <div class="wrapper">

      <div class="container__body">

        <?php // Winners ?>
        <?php foreach ($winners as $key => $winner) :?>
          <div class="__row">
            <div <?php if (isset($winner['image'])): ?>class="-columned"<?php endif; ?>>
              <?php if (isset($winner['fname'])): ?>
                <h3 class="inline--alt-color"><?php print $winner['fname']; ?></h3>
              <?php endif; ?>

              <?php if (isset($winner['field_winner_description'])): ?>
                <p><?php print $winner['field_winner_description']; ?></p>
              <?php endif; ?>

              <?php if (isset($winner['field_winner_quote'])): ?>
                <p>"<?php print $winner['field_winner_quote']; ?>"</p>
              <?php endif; ?>
            </div>

            <?php if (isset($winner['image'])): ?>
              <aside class="-columned -col-last">
                <?php print $winner['image']; ?>
              </aside>
            <?php endif; ?>
          </div>  
        <?php endforeach; ?>
        
      </div>

    </div>
  </section>

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

</article>
