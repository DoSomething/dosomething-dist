<?php
/**
 * Returns the HTML for Fact Page list.
 *
 * Available Variables
 * - $links: Array of links, keyed by the cause name.
 */
?>

<section class="container container--facts-list">
	<div class="wrapper">
		<h2 class="container__title visually-hidden"><?php print t('List of All Facts'); ?></h2>
		<div class="container__body">
			<?php foreach ($links as $cause => $fact_pages): ?>
			  <h3 class="inline--alt-color"><?php print $cause; ?></h3>
			  <ul>
			    <?php foreach ($fact_pages as $link): ?>
			    <li><?php print $link; ?></li>
			    <?php endforeach ; ?>
			  </ul>
			<?php endforeach; ?>
			</div>
	</div>
</section>
