<h1>RabbitMQ Status</h1>
<ul>
<?php foreach ($status as $status_type => $status): ?>
  <li><strong><?php print ucwords($status_type) ?></strong>: <?php print $status ?></li>
<?php endforeach; ?>  
</ul>
<h3>Tests</h3>
<ul>
  <li><?php print $test_links['all'] ?></li>
  <ul>
    <li><?php print $test_links['campaign-signup'] ?></li>
    <li><?php print $test_links['campaign-reportback'] ?></li>
    <li><?php print $test_links['user-password'] ?></li>
    <li><?php print $test_links['user-register'] ?></li>
    <li><?php print $test_links['user-register-under'] ?></li>
    <li><?php print $test_links['campaign-signup-noname'] ?></li>
    <li><?php print $test_links['campaign-reportback-noname'] ?></li>
  </ul>
</ul>
