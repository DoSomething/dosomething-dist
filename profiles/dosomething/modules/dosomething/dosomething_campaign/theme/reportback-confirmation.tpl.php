<h1>You Did It!</h1>

<p><?php print $copy; ?></p>

<?php print $more_campaigns_link; ?>

<?php print $back_to_campaign_link; ?>
<?php foreach ($recommended as $rec): ?>
  <div>
    <?php if (isset($rec['image'])): ?>
      <?php print $rec['image']; ?>
    <?php endif; ?>
    <h3><?php print $rec['title']; ?></h3>
    <p><?php print $rec['call_to_action']; ?></p>
  </div>
<?php endforeach; ?>
