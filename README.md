# ctrld-prom-exporter

— Get token: https://controld.com/dashboard/api\
— Start exporter:

```bash
CTRLD_API_TOKEN=api.1234321 CTRLD_EXPORTER_PORT=11000 npm run start
# OR
npm run start --token=api.1234321 --port=11000
```

— Update Prometheus `scrape_configs`\
— Import grafana dashboard [from file](grafana.json)
