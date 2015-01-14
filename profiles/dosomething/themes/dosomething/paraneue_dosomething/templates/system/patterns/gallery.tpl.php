<?php
/**
 * @file
 * Generates the HTML for a Neue Gallery pattern.
 *
 * Available variables:
 * - $layout: The gallery layout type.
 * - $classes: Additional classes to apply to the ul (string).
 * - $items: An array of items to display. Each $item in $items contains:
 *   - $item['class']: The class to apply to the li (string).
 *   - $item['content']: Themed item content (string).
 * - $roles: Data roles to be applied (string).
 *
 * @see paraneue_dosomething_get_gallery()
 */
?>
<ul class="gallery -<?php print $layout; ?> <?php print $classes; ?>" <?php if (isset($roles)) { print $roles; } ?>>
  <?php if (!empty($items)): ?>
    <?php foreach ($items as $item): ?>
      <li <?php if (!empty($item['class'])): print 'class="' . $item['class'] . '"'; endif; ?>>
        <?php print $item['content']; ?>
      </li>
    <?php endforeach; ?>
  <?php endif; ?>
</ul>
