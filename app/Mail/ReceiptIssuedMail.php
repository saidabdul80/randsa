<?php

namespace App\Mail;

use App\Models\Receipt;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReceiptIssuedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Receipt $receipt) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Receipt '.$this->receipt->receipt_number.' from '.$this->receipt->issuer_name,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.receipt-issued',
        );
    }
}
