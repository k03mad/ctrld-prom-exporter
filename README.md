# [ControlD — Prometheus] exporter

— [Get token](https://controld.com/dashboard/api) \
— [Use correct Node.JS version](.nvmrc) \
— Start exporter:

```bash
# one time
npm run setup

# start app
npm run start --token=api.1234321 --port=11000 --turnoff=ctrld_latency,ctrld_locations
# or with envs
CTRLD_API_TOKEN=api.1234321 CTRLD_EXPORTER_PORT=11000 CTRLD_EXPORTER_METRICS_TURN_OFF=ctrld_latency,ctrld_locations npm run start
```

[grafana-dashboards](https://github.com/k03mad/grafana-dashboards/tree/master/export)
