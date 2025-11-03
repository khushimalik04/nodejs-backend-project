import json
import boto3

# Initialize the SES client
ses = boto3.client("ses", region_name="ap-south-1")  # Change region if needed

def lambda_handler(event, context):
    print("=== EVENT RECEIVED ===")
    print(json.dumps(event, indent=2))

    for record in event.get("Records", []):
        try:
            # Parse the message from SQS
            message_body = json.loads(record["body"])
            print(f"Raw Message Body: {message_body}")

            # Extract details from message
            to_email = message_body.get("email")
            subject = message_body.get("subject", "Test Email from AWS Lambda (Python)")
            body = message_body.get("message", "Hello! This is a test email from Lambda via SES (Python).")

            if not to_email:
                print("Missing email address in message, skipping.")
                continue

            # SES email parameters
            response = ses.send_email(
                Source="mitrashubhojit2005@gmail.com",  # Replace with your SES-verified sender
                Destination={
                    "ToAddresses": [to_email],
                },
                Message={
                    "Subject": {"Data": subject},
                    "Body": {
                        "Text": {"Data": body},
                    },
                },
            )

            print(f"Email sent! Message ID: {response['MessageId']}")

        except Exception as e:
            print(f"Failed to send email: {str(e)}")

    return {
        "statusCode": 200,
        "body": json.dumps("All emails processed.")
    }
