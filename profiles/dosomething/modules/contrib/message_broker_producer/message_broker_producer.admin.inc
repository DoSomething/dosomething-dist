<?php

/**
 * @file
 * Content administration and module settings UI.
 */

/**
 * Configuration form
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
 * List RabbitMQ status
 */
function message_broker_producer_status() {

  $status = '';

  // List queues
  /* @todo: permission access issues for www user
   *
   * http://unix.stackexchange.com/questions/15264/executing-a-shell-command-from-php-with-shell-exec
   * Added:
   * http    ALL=(username) /usr/local/sbin/rabbitmqctl
   * to /etc/sudoers
   *
   * Program Execution in PHP: exec, system, passthru, and shell_exec, oh my!
   * http://chipmunkninja.com/Program-Execution-in-PHP%3A-exec-m@
   *
   * works
   * $directoryListing = shell_exec('ls -la /usr/local/sbin');
   */
  $queues = shell_exec('/usr/local/sbin/rabbitmqctl list_queues');
  if ($queues == NULL) {
    $status['queues'] = 'Queue Listing - No RabbitMQ queues found, check that RabbitMQ is running.';
  }
  else {
    $status['queues'] = print_r($queues, TRUE);
  }

  // List exchanges
  $exchanges = shell_exec('/usr/local/sbin/rabbitmqctl list_exchanges');
  if ($exchanges == NULL) {
    $status['exchanges'] = 'Exchange Listing - No RabbitMQ exchanges found, check that RabbitMQ is running.';
  }

  // List bindings
  $bindings = shell_exec('rabbitmqctl list_exchanges');
  if ($bindings == NULL) {
    $status['bindings'] = 'Bindings Listing - No RabbitMQ bindings found, check that RabbitMQ is running.';
  }

  // Test link to produce transactionals queue entry
  $test_links['all'] = 'Generate ' . l('test producer entry', 'admin/config/services/message-broker-producer/test') . '.';

  $test_links['campaign-signup'] = 'Generate ' . l('test campaign_signup producer entry', 'admin/config/services/message-broker-producer/test/campaign_signup') . '.';
  $test_links['campaign-reportback'] = 'Generate ' . l('test campaign_reportback producer entry', 'admin/config/services/message-broker-producer/test/campaign_reportback') . '.';
  $test_links['user-password'] = 'Generate ' . l('test user_password producer entry', 'admin/config/services/message-broker-producer/test/user_password') . '.';
  $test_links['user-register'] = 'Generate ' . l('test user_register producer entry', 'admin/config/services/message-broker-producer/test/user_register') . '.';
  $test_links['user-register-under'] = 'Generate ' . l('test user_register_under producer entry', 'admin/config/services/message-broker-producer/test/user_register_under') . '.';
  $test_links['campaign-signup-noname'] = 'Generate ' . l('test campaign_signup_noname producer entry', 'admin/config/services/message-broker-producer/test/campaign_signup_noname') . '.';
  $test_links['campaign-reportback-noname'] = 'Generate ' . l('test campaign_reportback_noname producer entry', 'admin/config/services/message-broker-producer/test/campaign_reportback_noname') . '.';
  
  return theme('message_broker_producer_status', array('status' => $status, 'test_links' => $test_links));
}

/**
 * Manage production type options.
 */
function message_broker_producer_production_options_form() {

  $mb_config_settings = message_broker_producer_load_config_options();

  // Load current "produciton" entries

  $exchanges = '';
  $selected_exchanges = '';

  // Produce listing of all "production" entries
  /*
  '#options' => array(
    0 => t('No'),
    1 => t('Yes'),
  ),
  */
  // Allow selection of the same exchange in multipul production entries.

  // Pull out exchanges for listing in multiselect
  $form['production_name'] = array(
    '#type' => 'textfield',
    '#title' => t('Production Name'),
    '#description' => t('The machine name to make '),
    '#required' => FALSE,
    '#default_value' => '',
  );
  $form['exchanges'] = array(
    '#type' => 'select',
    '#title' => t('Select Exchange(s)'),
    '#options' => $exchanges,
    '#default_value' => $selected_exchanges,
    '#description' => t('Select the exchange'),
  );
  $form['submit'] = array(
    '#type' => 'submit',
    '#value' => 'Add Production Type',
    '#weight' => 100,
  );

  // Validate and submit functions

  return $form;
}

/**
 * Load mb_config.json from library and format as PHP object.
 */
function message_broker_producer_load_config_options() {

  $mb_config_library = libraries_load('messagebroker-config');

  $mb_config_path = $GLOBALS['base_url'] . '/' . $mb_config_library['library path'] . '/mb_config.json';
  $mb_config_json = file_get_contents($mb_config_path);
  $mb_config_settings = json_decode($mb_config_json);

  return $mb_config_settings;
}
