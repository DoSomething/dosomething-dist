<?php
/**
 * Returns the HTML for Static Content pages.
 *
 * Available Variables
 * - $title: Title for the page (string).
 * - $subtitle: Subtitle for the page (string).
 */
?>

<section class="static_content-wrapper">
  <article id="node-<?php print $node->nid; ?>" class="<?php print $classes; ?> clearfix"<?php print $attributes; ?>>

    <?php if (isset($intro)): ?>
      <div class="intro-wrapper">
        <div class="intro<?php if (!isset($intro_title)): print ' no-title'; endif; ?>">
          <?php if (isset($intro_title)): ?>
            <h2><?php print $intro_title; ?></h2>
          <?php endif; ?>
            <div class="intro-content<?php if (isset($intro_image) OR isset($intro_video)): print " intro-content-half-width"; endif; ?>"><?php print $intro; ?></div>
          <?php if (isset($intro_image)): ?>
            <?php print $intro_image; ?>
          <?php elseif (isset($intro_video)): ?>
            <?php print $intro_video; ?>
          <?php endif; ?>
        </div>
      </div>
    <?php endif; ?>

    <?php if (isset($call_to_action)): ?>
      <div class="cta">
        <div class="wrapper">
          <h2 class="__message"><?php print $call_to_action; ?></h2>
          <?php print $cta_link; ?>
        </div>
      </div>
    <?php endif; ?>

    <?php if (!empty($content['field_blocks'])): ?>
    <?php print render($content['field_blocks']); ?>
    <?php endif; ?>

    <?php if (!empty($galleries)): ?>
      <div class="gallery-wrapper">
        <?php foreach ($galleries as $gallery): ?>
          <?php if (isset($gallery['title'])): ?>
            <h2 class="gallery-title"><?php print $gallery['title']; ?></h2>
          <?php endif; ?>
          <div class="gallery">
            <?php foreach ($gallery['items'] as $gallery_item): ?>
              <div class="gallery-item">
                <?php if (isset($gallery_item['image'])): ?>
                  <?php if (isset($gallery_item['image_title']) AND $gallery_item['image_url'] !== '') : ?>
                    <a href="<?php print $gallery_item['image_url']; ?>"><?php print $gallery_item['image']; ?></a>
                  <?php else : ?>
                    <?php print $gallery_item['image']; ?>
                  <?php endif; ?>
                <?php endif; ?>
                <?php if (isset($gallery_item['image_title'])): ?>
                  <h3 class="title"><?php print $gallery_item['image_title']; ?></h3>
                <?php endif; ?>
                <?php if (isset($gallery_item['image_description'])): ?>
                  <div class="gallery-description"><?php print $gallery_item['image_description']; ?></div>
                <?php endif; ?>
              </div>
            <?php endforeach; ?>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if (isset($additional_text)): ?>
    <div class="additional-text-wrapper">
      <div class="additional-text">
        <?php if (isset($additional_text_title)): ?>
          <h2><?php print $additional_text_title; ?></h2>
        <?php endif; ?>

        <p><?php print $additional_text; ?></p>
      </div>
    </div>
    <?php endif; ?>

    <?php if (isset($call_to_action)): ?>
      <div class="cta">
        <div class="wrapper">
          <h2 class="__message"><?php print $call_to_action; ?></h2>
          <?php print $cta_link; ?>
        </div>
      </div>
    <?php endif; ?>

    <?php if (isset($sponsors)): ?>
    <footer class="info-bar">
      <div class="wrapper">
        <?php if (isset($sponsors)): ?>
          <div class="sponsor">
            In partnership with <?php print $formatted_partners; ?>
          </div>
        <?php endif; ?>
      </div>
    </footer>
    <?php endif; ?>

  </article>
</section>
