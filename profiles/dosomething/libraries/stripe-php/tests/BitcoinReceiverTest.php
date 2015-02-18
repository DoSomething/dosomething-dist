<?php

namespace Stripe;

class BitcoinReceiverTest extends TestCase
{
    public function testUrls()
    {
        $classUrl = BitcoinReceiver::classUrl('Stripe_BitcoinReceiver');
        $this->assertSame($classUrl, '/v1/bitcoin/receivers');
        $receiver = new BitcoinReceiver('abcd/efgh');
        $instanceUrl = $receiver->instanceUrl();
        $this->assertSame($instanceUrl, '/v1/bitcoin/receivers/abcd%2Fefgh');
    }

    public function testCreate()
    {
        self::authorizeFromEnv();

        $receiver = $this->createTestBitcoinReceiver("do+fill_now@stripe.com");

        $this->assertSame(100, $receiver->amount);
        $this->assertNotNull($receiver->id);
    }

    public function testRetrieve()
    {
        self::authorizeFromEnv();

        $receiver = $this->createTestBitcoinReceiver("do+fill_now@stripe.com");

        $r = BitcoinReceiver::retrieve($receiver->id);
        $this->assertSame($receiver->id, $r->id);

        $this->assertInstanceOf('Stripe\\BitcoinTransaction', $r->transactions->data[0]);
    }

    public function testList()
    {
        self::authorizeFromEnv();

        $receiver = $this->createTestBitcoinReceiver("do+fill_now@stripe.com");

        $receivers = BitcoinReceiver::all();
        $this->assertTrue(count($receivers->data) > 0);
    }

    public function testListTransactions()
    {
        self::authorizeFromEnv();

        $receiver = $this->createTestBitcoinReceiver("do+fill_now@stripe.com");
        $this->assertSame(0, count($receiver->transactions->data));

        $transactions = $receiver->transactions->all(array("limit" => 1));
        $this->assertSame(1, count($transactions->data));
    }
}
