<h1>RabbitMQ Status</h1>
<h3>Status</h3>
<?php if (is_array($status)): ?>
  <ul>
  <?php foreach ($status as $status_type => $status): ?>
    <li><strong><?php print ucwords($status_type) ?></strong>: <?php print $status ?></li>
  <?php endforeach; ?>
  </ul>
  <h3>Virtual Hosts</h3>
  <ul>
  <?php foreach ($vhosts as $name => $send_oct): ?>
    <li><strong>Host Name: </strong><?php print $name ?>,
      <strong>Messages Sent: </strong><?php print number_format($send_oct) ?></li>
  <?php endforeach; ?>
  <?php if (count($vhosts) == 0): ?>
    <li>No Virtual Hosts reported. Check the RabbitMQ
      <a href="/admin/config/services/message-broker-producer/mq-settings">
        connection settings</a>.</li>
  <?php endif; ?>
  </ul>
  <h3>Overview</h3>
  <ul>
  <li><strong>RabbitMQ Version: </strong><?php print $overview['version'] ?></li><br />
  <?php foreach ($overview['nodes'] as $node_name => $node_entry): ?>
    <li><strong>Server: </strong><?php print $node_name ?>
      <ul>
        <?php foreach ($node_entry as $item => $value): ?>
        <li><strong><?php print ucwords($item) ?>: </strong><?php print $value ?></li>
        <?php endforeach; ?>
      </ul>
    </li><br />
  <?php endforeach; ?>
  <?php if (count($overview['nodes']) == 0): ?>
    <li><strong>No Servers reported.</strong> Check the RabbitMQ
      <a href="/admin/config/services/message-broker-producer/mq-settings">
        connection settings</a>.</li><br />
  <?php endif; ?>
  <li><strong>Counts:</strong>
    <ul>
    <?php foreach ($overview['object_totals'] as $name => $count): ?>
      <li><strong><?php print ucwords($name) ?>: </strong><?php print $count ?></li>
    <?php endforeach; ?>
    </ul>
  </li><br />
  <?php foreach ($overview['contexts'] as $idx => $context): ?>
    <li><strong>Context: </strong><?php print $context['node'] ?>
      <ul>
        <li><strong>Description: </strong><?php print $context['description'] ?></li>
        <li><strong>Port: </strong><?php print $context['port'] ?></li>
      </ul>
    </li><br />
  <?php endforeach; ?>
  <?php if (count($overview['contexts']) == 0): ?>
    <li><strong>No Contexts reported.</strong> Check the RabbitMQ
      <a href="/admin/config/services/message-broker-producer/mq-settings">
        connection settings</a>.</li><br />
  <?php endif; ?>
  </ul>
  <h3>Tests</h3>
  <ul>
    <li><?php print $test_links['campaign-signup'] ?></li>
  </ul>
<?php else: ?>
  <p>*Bleep*... something is wrong?!?</p>
<?php endif; ?>