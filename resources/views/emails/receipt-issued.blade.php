<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $receipt->receipt_number }}</title>
</head>
<body style="margin:0;background:#f6f7f8;color:#0f172a;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:760px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;box-shadow:0 24px 80px rgba(15,23,42,.08);">
            <div style="padding:28px;border-bottom:3px solid #0f172a;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="vertical-align:top;">
                            <p style="margin:0;font-size:24px;line-height:1.25;font-weight:900;color:#065f46;">{{ $receipt->item_title }}</p>
                            <p style="margin:6px 0 0;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">{{ str_replace('_', ' ', ucfirst($receipt->receipt_type)) }}</p>
                        </td>
                        <td style="text-align:right;vertical-align:top;">
                            <p style="margin:0;font-size:28px;font-weight:900;color:#0f172a;">Receipt</p>
                            <p style="margin:6px 0 0;font-size:13px;font-weight:800;color:#64748b;">{{ $receipt->receipt_number }}</p>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="padding:28px;">
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                    <tr>
                        <td style="padding:0 16px 0 0;vertical-align:top;">
                            <p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;">Payment date</p>
                            <p style="margin:0;font-size:14px;font-weight:900;color:#0f172a;">{{ $receipt->paid_at->toFormattedDateString() }}</p>
                        </td>
                        <td style="padding:0 16px;vertical-align:top;">
                            <p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;">Method</p>
                            <p style="margin:0;font-size:14px;font-weight:900;color:#0f172a;">{{ str_replace('_', ' ', ucfirst($receipt->payment_method)) }}</p>
                        </td>
                        <td style="padding:0 0 0 16px;text-align:right;vertical-align:top;">
                            <p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;">Issue date</p>
                            <p style="margin:0;font-size:14px;font-weight:900;color:#0f172a;">{{ $receipt->issued_at->toFormattedDateString() }}</p>
                        </td>
                    </tr>
                </table>

                @if ($receipt->property_address)
                    <p style="margin:0 0 8px;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#047857;">Post location</p>
                    <p style="margin:0;color:#0f172a;font-size:16px;line-height:1.55;font-weight:900;">{{ $receipt->property_address }}</p>
                @endif

                <table style="width:100%;border-collapse:collapse;margin-top:26px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
                    <tr>
                        <td style="padding:20px 18px 20px 0;vertical-align:top;">
                            <p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;">Received from</p>
                            <p style="margin:0;font-size:18px;font-weight:900;">{{ $receipt->customer_name }}</p>
                        </td>
                        <td style="padding:20px 0 20px 18px;vertical-align:top;">
                            <p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;">Issued by</p>
                            <p style="margin:0;font-size:18px;font-weight:900;">{{ $receipt->issuer_name }}</p>
                        </td>
                    </tr>
                </table>

                <div style="margin-top:24px;background:#047857;color:#ffffff;padding:18px 20px;">
                    <p style="margin:0;font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#d1fae5;">Amount received</p>
                    <p style="margin:6px 0 0;font-size:34px;font-weight:900;">{{ $receipt->currency }} {{ number_format((float) $receipt->amount, 2) }}</p>
                </div>

                <p style="margin:24px 0 0;color:#334155;font-size:14px;line-height:1.8;font-weight:700;">
                    This acknowledges that the amount above was received from {{ $receipt->customer_name }} as payment for {{ $receipt->item_title }}.
                </p>

                @if ($receipt->period_start || $receipt->period_end || $receipt->payment_reference)
                    <table style="width:100%;border-collapse:collapse;margin-top:18px;">
                        @if ($receipt->period_start || $receipt->period_end)
                            <tr>
                                <td style="padding:10px 0;color:#64748b;font-weight:700;">Period covered</td>
                                <td style="padding:10px 0;text-align:right;font-weight:900;">
                                    {{ $receipt->period_start?->toFormattedDateString() ?? 'Not set' }} to {{ $receipt->period_end?->toFormattedDateString() ?? 'Not set' }}
                                </td>
                            </tr>
                        @endif
                        @if ($receipt->payment_reference)
                            <tr>
                                <td style="padding:10px 0;color:#64748b;font-weight:700;">Reference</td>
                                <td style="padding:10px 0;text-align:right;font-weight:900;">{{ $receipt->payment_reference }}</td>
                            </tr>
                        @endif
                    </table>
                @endif

                @if ($receipt->notes)
                    <p style="margin:18px 0 0;padding:14px 16px;background:#f8fafc;color:#475569;font-weight:700;">{{ $receipt->notes }}</p>
                @endif

                <table style="width:100%;border-collapse:collapse;margin-top:46px;text-align:center;">
                    <tr>
                        <td style="padding:14px 18px 0 0;border-top:1px solid #0f172a;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">Landlord / provider sign</td>
                        <td style="padding:14px 0 0 18px;border-top:1px solid #0f172a;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">Customer sign</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
