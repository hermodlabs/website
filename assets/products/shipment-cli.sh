# Start with the app's sample shipment.
decision-lab case init \
  --app shipment.app.json \
  --output shipment.case.yaml

# Check the inputs.
decision-lab case validate \
  --app shipment.app.json \
  --case shipment.case.yaml

# Calculate and save the complete result.
decision-lab run \
  --app shipment.app.json \
  --case shipment.case.yaml \
  --output shipment.run.json
