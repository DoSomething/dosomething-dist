<?php
/**
 * Expected variables:
 *  - $sponsors: (array) Expected data:
 *    - logo_url: (string) URL of the logo file to render.
 *    - name: (string) Sponsor name
 */
?>
<div class="sponsor">
  <p class="__copy">Powered by</p>
  <?php foreach ($sponsors as $sponsor) :?>
    <img src="<?php print $sponsor['logo_url']; ?>" alt="<?php print $sponsor['name']; ?>" />
  <?php endforeach; ?>
</div>
