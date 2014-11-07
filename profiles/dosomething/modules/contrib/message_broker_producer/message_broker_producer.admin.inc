<?php

define ('MQ_CONNECT_TIMEOUT', 5);
define ('MQ_EXECUTE_TIMEOUT', 5);

/**
 * @file
 * Content administration and module settings UI.
 */

/**
 * Configuration and connection settings.
 *
 * @parm array $form
 *   Array of form elements.
 * @parm array &$form_state
 *   Array of the state of the form elements.
 */
function message_broker_producer_config_form($form, &$form_state) {

  $form['authentication'] = array(
    '#type' => 'fieldset',
    '#title' => t('RabbitMQ Authentication')
  );
  $form['authentication']['message_broker_producer_rabbitmq_host'] = array(
    '#type' => 'textfield',
    '#title' => t('host'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_host', 'localhost'),
  );
  $form['authentication']['message_broker_producer_rabbitmq_port'] = array(
    '#type' => 'textfield',
    '#title' => t('port'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_port', '5672'),
  );
  $form['authentication']['message_broker_producer_rabbitmq_username'] = array(
    '#type' => 'textfield',
    '#title' => t('Username'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_username', 'guest'),
  );
  $form['authentication']['message_broker_producer_rabbitmq_password'] = array(
    '#type' => 'textfield',
    '#title' => t('Password'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_password', 'guest'),
  );
  $form['authentication']['message_broker_producer_rabbitmq_vhost'] = array(
    '#type' => 'textfield',
    '#title' => t('vhost'),
    '#required' => FALSE,
    '#default_value' => variable_get('message_broker_producer_rabbitmq_vhost', ''),
  );

  $form['configuration'] = array(
    '#type' => 'fieldset',
    '#title' => t('Producer Configuration')
  );
  $form['configuration']['message_broker_producer_application_id'] = array(
    '#type' => 'textfield',
    '#title' => t('Application ID'),
    '#required' => TRUE,
    '#default_value' => variable_get('message_broker_producer_application_id', '-1'),
  );

  return system_settings_form($form);
}

/**
 * List RabbitMQ status via connection to RabbitMQ management plugin supplied
 * endpoint via port 15672.
 */
function message_broker_producer_status() {

  // RabbitMQ Management API
  // http://hg.rabbitmq.com/rabbitmq-management/raw-file/rabbitmq_v3_3_5/priv/www/api/index.html

  // Control returned results
  // curl -i -u guest:guest 'http://localhost:15672/api/channels?sort=message_stats.publish_details.rate&sort_reverse=true&columns=name,message_stats.publish_details.rate,message_stats.deliver_get_details.rate'

  $rabbit_username = variable_get('message_broker_producer_rabbitmq_username', 'guest');
  $rabbit_password = variable_get('message_broker_producer_rabbitmq_password', 'guest');
  $rabbit_vhost = variable_get('message_broker_producer_rabbitmq_vhost', '%2F');

  // Ensure empty vhost setting reverts to "%2F"
  if ($rabbit_vhost == '') {
    $rabbit_vhost = '%2F';
  }

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
  curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-type: application/json',
    'Accept: application/json'
  ));
  curl_setopt($ch, CURLOPT_USERPWD, "$rabbit_username:$rabbit_password");
  curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);

  // If the server is down, the smaller of the following two values
  // will kick in first.
  // CURLOPT_CONNECTTIMEOUT == connection timeout in seconds.
  // CURLOPT_TIMEOUT == curl function execution timeout in seconds.
  curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, MQ_CONNECT_TIMEOUT);
  curl_setopt($ch, CURLOPT_TIMEOUT, MQ_EXECUTE_TIMEOUT);

  $rabbit_management_api_urls = array(
    'api-aliveness-test' => variable_get('message_broker_producer_rabbitmq_host', 'localhost') .':15672/api/aliveness-test/' . $rabbit_vhost,
    'api-vhosts' => variable_get('message_broker_producer_rabbitmq_host', 'localhost') .':15672/api/vhosts/',
    'api-overview' => variable_get('message_broker_producer_rabbitmq_host', 'localhost') .':15672/api/overview/',
  );

  foreach ($rabbit_management_api_urls as $call => $rabbit_management_api_url) {

    curl_setopt($ch, CURLOPT_URL, $rabbit_management_api_url);
    $jsonResult = curl_exec($ch);
    $results = json_decode($jsonResult);

    // Management API connection failed, report error, no need to test further
    if (!$results) {
      drupal_set_message("No results for call to API '$call', " . 'check the
        connection to the Message Broker server. Is the VPN connection working
        or perhaps review the ' . l('RabbitMQ settings', 'admin/config/services/message-broker-producer/mq-settings') . '.', 'error');
      return theme('message_broker_producer_status',
        array('status' => '', 'vhosts' => '', 'overview' => '', 'test_links' => ''));
    }
    elseif (isset($results->error)) {
      drupal_set_message('Management API call: ' . $call . ' reported "<strong>' . $results->reason . '</strong>". Is the VPN connection working
        or perhaps review the ' . l('RabbitMQ settings', 'admin/config/services/message-broker-producer/mq-settings') . '.', 'error');
      return theme('message_broker_producer_status',
        array('status' => '', 'vhosts' => '', 'overview' => '', 'test_links' => ''));
    }

    switch ($call) {
      case 'api-aliveness-test':
        $status = array();
        if ($results) {
          $status[$call] = $results->status;
        }
        break;

      case 'api-vhosts':
        $vhosts = array();
        if ($results) {
          foreach ($results as $idx => $entry) {
            if (!isset($entry->send_oct)) {
              continue;
            }

            $name = $entry->name;
            $send_oct = $entry->send_oct;
            $vhosts[$name] = $send_oct;

          }
        }
        break;

      case 'api-overview':
        $overview = array();

        $overview['version'] = $results->rabbitmq_version;

        // Extract results for Servers/Listeners.
        $overview['nodes'] = array();
        if ($results) {
          foreach ($results->listeners as $idx => $listener) {
            $overview['nodes'][$listener->node]  = array(
              'protocol' => $listener->protocol,
              'port' => $listener->port,
              'ip_address' => $listener->ip_address,
            );
          }
        }

        // Extract results for various Counts.
        $overview['object_totals'] = array();
        if ($results) {
          foreach ($results->object_totals as $name => $count) {
            $overview['object_totals'][$name] = $count;
          }
        }

        // Extract results for Contexts.
        $overview['contexts'] = array();
        if ($results) {
          foreach ($results->contexts as $idx => $context) {
            $overview['contexts'][$idx] = array(
              'node' => $context->node,
              'description' => $context->description,
              'port' => $context->port,
            );
          }
        }

        break;
    }

  }

  // Test link to produce transactionals queue entry
  $test_links['campaign-signup'] = 'Generate ' . l('test campaign_signup producer entry', 'admin/config/services/message-broker-producer/test/campaign_signup') . '.';

  return theme('message_broker_producer_status',
                array(
                  'status' => $status,
                  'vhosts' => $vhosts,
                  'overview' => $overview,
                  'test_links' => $test_links,
                ));
}

/*
 * List production entries in the message_broker_producer database table.
 *
 * A production entry defines the exchange(s) and queue(s) that a message is
 * sent to and how it's distributed to the the queues.
 *
 * @return
 *   A list in table format of production entries.
 */
function message_broker_producer_production_list() {

  $header = array('Production Name', 'Queues', 'Routing Key', 'Status', 'Last Updated', '');

  $productions = array();

  $query = db_select('message_broker_producer_productions', 'mbpp', array('target' => 'slave'))
    ->orderBy('machine_name')
    ->fields('mbpp');
  $result = $query->execute();

  // Build each row of the table
  foreach ($result as $production_count => $row) {
    $config = unserialize($row->config);
    $queues = '<ul>';
    foreach($config->queues as $queue_count => $queue) {
      $queues .= '<li>' . $queue->name . '</li>' . "\n";
    }
    $queues .= '</ul>';
    $delete_link
      = l(t('Delete'),
          'admin/config/services/message-broker-producer/delete-production/'
            . $row->machine_name
        );
    $productions[] = array(
      'machine_name' => l($row->machine_name, 'admin/config/services/message-broker-producer/add-edit-production/' . $row->machine_name),
      'queues' => $queues,
      'routing_key' => $row->routing_key,
      'status' => ($row->status) ? 'Enabled' : 'Disabled',
      'updated' => date('D M j G:i:s T Y', $row->updated),
      'delete_link' => $delete_link,
    );
  }

  return theme('message_broker_producer_production_list',
    array(
      'productions' => theme('table', array('header' => $header, 'rows' => $productions)),
    ));
}

/*
 * Pass through function to allow parameters to a form via a hook_menu call to
 * message_broker_producer_production_options_form()
 *
 * @parm string $target_production
 *   Update/delete of a production record, $target_production will have a value.
 * @parm boolean $queue_reset
 *   Trigger reset of select queues, reload from config file based on selected
 *   exchange supplied in parameter.
 *
 * @return
 *   Call to drupal_get_form for the message_broker_producer_production_options_form
 *   form that includes the additional parameter $target_production
 */
function message_broker_producer_production_options_update($target_production, $queue_reset = '') {
  return drupal_get_form('message_broker_producer_production_options_form', $target_production, $queue_reset);
}

/**
 * Manage production type options - create, update and delete.
 *
 * If there are only three arguments in the path it builds the add form and
 * adds a record. Otherwise it builds the update form where the fourth
 * argument is the machine_name of the production entry in the
 * message_broker_producer table.
 *
 * @parm array $form
 *   Array of form elements.
 * @parm array &$form_state
 *   Array of the state of the form elements.
 * @parm string $target_production
 *   Update/delete of a production record, $target_production will have a value.
 * @parm boolean $exchange_queue_reset
 *   Trigger reset of select queues, reload from config file based on selected
 *   exchange supplied in parameter.
 *
 * @return
 *   $form: An array of the form elements
 */
function message_broker_producer_production_options_form($form, &$form_state, $target_production = NULL, $exchange_queue_reset = '') {

  $mb_config_settings = message_broker_producer_load_config_options();
  $exchanges[0] = '-- Select exchange --';
  foreach($mb_config_settings->rabbit->exchanges as $exchange) {
    $exchanges[$exchange->name] = $exchange->name;
  }

  if ($target_production == NULL) {
    $form_action = 'Add';
    $form['message_broker_producer_production_heading'] = array(
      '#markup' => '<h1>Add Production</h1>'
    );

    $production_name = '';
    $selected_exchange = '';
    $selected_exchange_type = '';
    $selected_exchange_description = t('Select an exchange to send production requests to.');
    $routing_key = '';
    $enabled = FALSE;
    $submit_label = 'Add Production Type';
    $update_production = FALSE;

    $form['message_broker_producer_target'] = array(
      '#type' => 'value',
      '#value' => NULL,
    );
  }
  else {
    $form_action = 'Update';
    $form['message_broker_producer_production_heading'] = array(
      '#markup' => '<h1>Update Production</h1>'
    );

    $production_name = $target_production;
    // Lookup production details to display in form while in edit state
    $query = db_select('message_broker_producer_productions', 'mbp', array('target' => 'slave'))
      ->fields('mbp', array('config', 'routing_key', 'status', 'updated'))
      ->condition('mbp.machine_name', $production_name, '=');
    $record = $query->execute()
      ->fetchObject();
    $production_config = unserialize($record->config);
    $selected_exchange = $production_config->name;
    $selected_exchange_type = $production_config->type;
    $selected_exchange_description = 'Type: <strong>' . $selected_exchange_type . '</strong><br />' . $production_config->__comment;

    $form['queues'] = array(
      '#type' => 'fieldset',
      '#title' => t('Queues'),
      '#collapsible' => TRUE,
      '#collapsed' => FALSE,
      '#weight' => 70,
    );

    // Reset assigned queues, reload from config file rather than load from
    // config value in database record for production entry.
    if (isset($exchange_queue_reset) && $exchange_queue_reset != '') {
      $production_config->queues = $mb_config_settings->rabbit->exchanges->$exchange_queue_reset->queues;
    }

    foreach ($production_config->queues as $queue) {

      $form['queues']['message_broker_producer_queue_' . $queue->name] = array(
        '#title' => $queue->name,
        '#type' => 'checkbox',
        '#default_value' => TRUE,
        '#prefix' => '<div style="border: 2px solid; margin: 5px; padding: 3px; width: 350px;">',
        '#description' => (isset($queue->__comment)) ? $queue->__comment : ''
      );

      if ($production_config->type == 'topic') {
        $form['queues']['message_broker_producer_queue_' . $queue->name]['#suffix'] = 'Binding Pattern: <strong>' . $queue->binding_pattern . '</strong></div>';
      }
      else {
        $form['queues']['message_broker_producer_queue_' . $queue->name]['#suffix'] = 'Binding Key: <strong>' . $queue->binding_key . '</strong></div>';
      }

    }
    // Queue reset link
    $form['queues']['message_broker_producer_queue_reset'] = array(
      '#type' => 'item',
      '#markup' => l(t('-> Reload queues from config file.'), 'admin/config/services/message-broker-producer/add-edit-production/' . $production_name . '/' . $selected_exchange),
    );

    $routing_key = $record->routing_key;
    $enabled = $record->status;
    $submit_label = 'Edit Production Type';
    $update_production = TRUE;

    // Maintain the previous selected exchange. If changed all the queue settings
    // need to be reloaded
    $form['message_broker_producer_previous_exchange'] = array(
      '#type' => 'value',
      '#value' => $selected_exchange,
    );
    // Maintain the previous config to ensure past setting are not lost in
    // this update
    $form['message_broker_producer_previous_config'] = array(
      '#type' => 'value',
      '#value' => serialize($production_config),
    );
    // Used to monitor is it's an update or a new production
    $form['message_broker_producer_target'] = array(
      '#type' => 'value',
      '#value' => $target_production,
    );
  }

  // Pull out exchanges for listing in multiselect
  $form['message_broker_producer_production_name'] = array(
    '#type' => 'textfield',
    '#title' => t('Production Name'),
    '#description' => t('A unique machine friendly production name to be referenced to access specific production entries.'),
    '#required' => TRUE,
    '#default_value' => $production_name,
  );
  $form['message_broker_producer_exchange'] = array(
    '#type' => 'select',
    '#title' => t('Select Exchange(s)'),
    '#options' => $exchanges,
    '#default_value' => $selected_exchange,
    '#description' => $selected_exchange_description,
    '#required' => TRUE,
    '#weight' => 60,
  );
  $form['message_broker_producer_routing_key'] = array(
    '#type' => 'textfield',
    '#title' => t('Routing Key'),
    '#description' => t('Based on the exchange type selected - "' . $selected_exchange . '" is a <strong>' . $selected_exchange_type . '</strong> exchange, the queues assigned to the exchange will have "Binding Patterns" or "Binding Key" values to help define the routing key value for this production. The exchange type and routing key value defines how messages are distributed to the various connected queues.'),
    '#required' => FALSE,
    '#default_value' => $routing_key,
    '#access' => $update_production,
    '#weight' => 80,
  );
  $form['message_broker_producer_status'] = array(
    '#type' => 'radios',
    '#title' => t('Enable/Disable Production'),
    '#default_value' => $enabled,
    '#options' => array(
      1 => 'Enable production',
      0 => 'Disable production',
    ),
    '#weight' => 90,
    '#access' => $update_production
  );
  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => $submit_label,
    '#weight' => 100,
  );
  $form['cancel'] = array(
    '#markup' => l(t('Cancel'), 'admin/config/services/message-broker-producer'),
    '#weight' => 101,
  );

  return $form;
}

/**
 * Validate form submissions from message_broker_producer_production_options_form().
 *
 * @parm array $form
 *   Array of form elements.
 * @parm array &$form_state
 *   Array of the state of the form elements.
 */
function message_broker_producer_production_options_form_validate($form, &$form_state) {

  if ($form_state['values']['message_broker_producer_production_name'] == '') {
    form_set_error('message_broker_producer_production_name', t('The production name is required.'));
  }
  else {
    if (strpos($form_state['values']['message_broker_producer_production_name'], ' ') !== FALSE) {
      form_set_error('message_broker_producer_production_name', t('The production name must not contain spaces.'));
    }
    // @todo: Query db for production name
    $production_name_exists = FALSE;

    if ($production_name_exists) {
      form_set_error('message_broker_producer_production_name', t('The production name (!production_name) already exists. Use a unique name or delete the existing entry first.', array('!production_name' => $form_state['values']['message_broker_producer_production_name'])));
    }
  }
  if ($form_state['values']['message_broker_producer_exchange'] == '0') {
    form_set_error('message_broker_producer_exchange', t('An exchange selection is required.'));
  }

  // @todo: Add validation when status is enabled
  //  - validate  routing key value as validated based on selected queues and the exchange type

  // validate that at least one queue is included in production in "edit" state (message_broker_producer_target is set)
  if ($form_state['values']['message_broker_producer_target'] != NULL) {
    $queue_selected = FALSE;
    foreach($form_state['values'] as $submitted_field_index => $submitted_field_value) {
      if ((strpos($submitted_field_index, 'message_broker_producer_queue_') !== FALSE) && ($submitted_field_value == 1)) {
        $queue_selected = TRUE;
      }
    }
    if (!$queue_selected) {
      form_set_error('message_broker_producer_exchange', t('At least one queue must be enabled for the production. The queue list has been reloaded from the configuration file.'));
       drupal_goto('admin/config/services/message-broker-producer/add-edit-production/' . $form_state['values']['message_broker_producer_production_name'] . '/' . $form_state['values']['message_broker_producer_exchange']);
    }
  }
}

/**
 * Process data submitted from message_broker_producer_production_options_form().
 *
 * @parm array $form
 *   Array of form elements.
 * @parm array &$form_state
 *   Array of the state of the form elements.
 */
function message_broker_producer_production_options_form_submit($form, &$form_state) {

  $production_name = check_plain($form_state['values']['message_broker_producer_production_name']);
  $selected_exchange = check_plain($form_state['values']['message_broker_producer_exchange']);

  // "target" is set, update production entry rather than create new entry
  if ($form_state['values']['message_broker_producer_target'] == NULL) {

    // New production entry, return user to the production form in  the edit
    // state to complete configuration settings based on the initial exchange
    // selection.
    $form_state['redirect'] = 'admin/config/services/message-broker-producer/add-edit-production/' . $production_name;
    message_broker_producer_production_insert(array('machine_name' => $production_name, 'exchange' => $selected_exchange));

    drupal_set_message('The ' . $form_state['values']['message_broker_producer_production_name'] . ' production type has been created. Complete production settings by defining the routing key value and optionally adjusting what queues the production should distribute messages to.', 'notice');
  }
  else {

    // production entry is being updated, redirect user back to production listings when done
    $form_state['redirect'] = 'admin/config/services/message-broker-producer/list-productions';

    // Check for change in exchange, reload queues from config if changed
    if ($form_state['values']['message_broker_producer_previous_exchange'] == $selected_exchange) {

      // Gather settings for selected exchange
      $mb_config_settings = unserialize($form_state['values']['message_broker_producer_previous_config']);

      foreach($mb_config_settings->queues as $queue) {
        foreach($form_state['values'] as $queue_name => $queue_state) {
          if ((substr($queue_name, 30) == $queue->name) && ($queue_state == 0)) {
            $remove_queue = substr($queue_name, 30);
            unset($mb_config_settings->queues->$remove_queue);
          }
        }
      }

      $selected_exchange_config = serialize($mb_config_settings);
    }
    else {

      // Gather settings for selected exchange
      $mb_config_settings = message_broker_producer_load_config_options();

      $selected_exchange_config = '';
      foreach($mb_config_settings->rabbit->exchanges as $exchange_index => $exchange) {
        if ($exchange_index == $selected_exchange) {
          $selected_exchange_config = serialize($exchange);
          break;
        }
      }

    }

    $routing_key = check_plain($form_state['values']['message_broker_producer_routing_key']);
    $status = check_plain($form_state['values']['message_broker_producer_status']);

    db_update('message_broker_producer_productions')
      ->fields(array(
        'machine_name' => $production_name,
        'config' => $selected_exchange_config,
        'routing_key' => $routing_key,
        'status' => $status,
        'updated' => time(),
      ))
      ->condition('machine_name', $production_name)
      ->execute();

    drupal_set_message('The ' . $form_state['values']['message_broker_producer_production_name'] . ' production type has been updated.', 'notice');
  }

  return;
}

/**
 * Build a confirmation form for deleting a production.
 *
 * @parm array $form
 *   Array of form elements.
 * @parm array &$form_state
 *   Array of the state of the form elements.
 * @parm string $machine_name
 *   Machine name of production to be deleted.
 */
function message_broker_producer_delete_confirm($form, &$form_state, $machine_name = NULL) {
  $form['machine_name'] = array(
    '#type' => 'value',
    '#value' => $machine_name,
  );

  $heading = t('Delete');
  $cancel_path = array('path' => 'admin/config/services/message-broker-producer/list-productions');
  $caption = t('<p>Are you sure you want to delete this production?</p>'
    . '<p>This action cannot be undone.</p>');
  $yes = t('Delete');
  $no = t('Cancel');

  return confirm_form($form, $heading, $cancel_path, $caption, $yes, $no);
}

/**
 * Submit function for the form for deleting a production.
 *
 * Deletes the production from the database, and
 * returns the user to the List Productions page.
 *
 * @parm array $form
 *   Array of form elements.
 * @parm array &$form_state
 *   Array of the state of the form elements.
 */
function message_broker_producer_delete_confirm_submit($form, &$form_state) {

  $machine_name = $form_state['values']['machine_name'];

  $num_deleted = db_delete('message_broker_producer_productions')
    ->condition('machine_name', $machine_name)
    ->execute();

  if ($num_deleted == 1) {
    drupal_set_message(t('The production has been deleted.'), 'status');
  }
  else {
    drupal_set_message(
      t('The production was <strong>NOT</strong> deleted from the database.'),
      'error');
  }

  $form_state['redirect'] = 'admin/config/services/message-broker-producer/list-productions';
}
