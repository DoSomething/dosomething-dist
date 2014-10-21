<div id="taxonomy-term-<?php print $term->tid; ?>" class="<?php print $classes; ?>">

  <header role="banner" class="-hero <?php print $classes; ?>">
    <div class="wrapper">
      <h1 class="__title"><?php print $term->name; ?></h1>
      <?php if (isset($subtitle)): ?>
        <h2 class="__subtitle"><?php print $subtitle; ?></h2>
      <?php endif; ?>
    <?php if (!empty($sponsor_logos)): ?>
      <div class="promotions"><?php print $sponsor_logos; ?></div>
    <?php endif; ?>
    </div>
  </header>

  <?php if (isset($intro)): ?>
    <section class="container container--intro">
      <div class="wrapper">
        <div class="container__body">
          <div<?php if (isset($intro_video)): print ' class="-columned"'; endif; ?>>
          <?php print $intro; ?>
          </div>
          <?php if (isset($intro_video)): ?>
          <aside class="-columned -col-last">
            <div class="media-video">
              <?php print $intro_video; ?>
            </div>
          </aside>
          <?php endif; ?>
        </div>
      </div>
    </section>
  <?php endif; ?>

  <?php if (!empty($campaign_gallery)): ?>
    <?php print $campaign_gallery; ?>
  <?php endif; ?>

  <section class="container additional-text">
    <div class="wrapper">

      <?php if (isset($global_copy['campaign_value_proposition'])): ?>
        <h2 class="container__title inline--alt-color">
          <?php print t('What You Get'); ?>
        </h2>
        <?php print $global_copy['campaign_value_proposition']; ?>
      <?php endif; ?>

      <?php if (isset($global_copy['scholarships'])): ?>
        <h2 class="container__title inline--alt-color">
          <?php print t('Scholarships and Contests'); ?>
        </h2>
        <?php print $global_copy['scholarships']; ?>
      <?php endif; ?>

      <?php if (isset($global_copy['about_ds'])): ?>
        <h2 class="container__title inline--alt-color">
          <?php print t('About Dosomething.org'); ?>
        </h2>
        <?php print $global_copy['about_ds']; ?>
      <?php endif; ?>

    </div>
  </section>
</div>
