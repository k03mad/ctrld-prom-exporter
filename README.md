ctrld-prom-exporter • [tin-invest-prom-exporter](https://github.com/k03mad/tin-invest-prom-exporter) • [ya-iot-prom-exporter](https://github.com/k03mad/ya-iot-prom-exporter)

# [ControlD — Prometheus] exporter

— [Get token](https://controld.com/dashboard/api) \
— [Use correct Node.JS version](.nvmrc) \
— Start exporter:

```bash
npm run start --token=api.1234321 --port=11000
# or with envs
CTRLD_API_TOKEN=api.1234321 CTRLD_EXPORTER_PORT=11000 npm run start
```

— Update Prometheus `scrape_configs` \
— [Import Grafana dashboard](grafana.json)
