• ctrld-prom-exporter \
• [mik-prom-exporter](https://github.com/k03mad/mik-prom-exporter) \
• [mosobleirc-prom-exporter](https://github.com/k03mad/mosobleirc-prom-exporter) \
• [ping-prom-exporter](https://github.com/k03mad/ping-prom-exporter) \
• [sys-prom-exporter](https://github.com/k03mad/sys-prom-exporter) \
• [tin-invest-prom-exporter](https://github.com/k03mad/tin-invest-prom-exporter) \
• [ya-iot-prom-exporter](https://github.com/k03mad/ya-iot-prom-exporter)

:: [grafana-dashboards](https://github.com/k03mad/grafana-dashboards/tree/master/export) ::

# [ControlD — Prometheus] exporter

— [Get token](https://controld.com/dashboard/api) \
— [Use correct Node.JS version](.nvmrc) \
— Start exporter:

```bash
# one time
npm run setup

# start app
npm run start --token=api.1234321 --port=11000 --turnoff=ctrld_latency,ctrld_locations --redirect=some.domain.com,another.domain.com
# or with envs
CTRLD_API_TOKEN=api.1234321 CTRLD_EXPORTER_PORT=11000 CTRLD_EXPORTER_METRICS_TURN_OFF=ctrld_latency,ctrld_locations CTRLD_EXPORTER_REDIRECT_DOMAINS_RANDOM=some.domain.com,another.domain.com npm run start
```
