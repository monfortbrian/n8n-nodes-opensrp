# n8n-nodes-opensrp

[![npm](https://img.shields.io/npm/v/n8n-nodes-opensrp)](https://www.npmjs.com/package/n8n-nodes-opensrp)
[![npm downloads](https://img.shields.io/npm/dt/n8n-nodes-opensrp)](https://www.npmjs.com/package/n8n-nodes-opensrp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

n8n community node for [OpenSRP](https://opensrp.io/), a FHIR-native, offline-first field operations platform built for frontline workers in low-connectivity environments. Assign field tasks, manage catchment assets, track community health workers, and automate WASH, epidemic control, agritech, and humanitarian workflows.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

---

## Installation

**Via n8n UI:** Settings → Community Nodes → search `n8n-nodes-opensrp` → Install

**Via npm:**
```bash
npm install n8n-nodes-opensrp
```

---

## Credentials

| Field          | Description                                              |
|----------------|----------------------------------------------------------|
| Base URL       | Your OpenSRP FHIR server URL (e.g. `https://opensrp.example.org/fhir`) |
| Token Endpoint | Keycloak token URL (e.g. `https://keycloak.example.org/auth/realms/opensrp/protocol/openid-connect/token`) |
| Client ID      | OAuth2 client ID from Keycloak                          |
| Client Secret  | OAuth2 client secret from Keycloak                      |

> Bearer Token mode is also supported for local development instances.

---

## Resources & Operations

| Resource      | FHIR Equivalent              | Operations                        |
|---------------|------------------------------|-----------------------------------|
| Catchment     | Location                     | Register Asset, Get Status        |
| Frontliner    | Practitioner / PractitionerRole | Get Lineup, Track Performance  |
| FieldTask     | Task                         | Assign Task, Monitor Status       |
| Resident      | Patient / Group              | Enroll, Get History, Search Cohort|
| FieldEncounter| Encounter / Observation      | Extract Observations              |

---

## Example: Assign a Field Task

```json
{
  "resourceType": "Task",
  "status": "requested",
  "intent": "order",
  "priority": "urgent",
  "description": "Inspect Water Pump Zone B for contamination",
  "for": { "reference": "Location/CATCHMENT_ID" },
  "owner": { "reference": "Practitioner/FRONTLINER_ID" },
  "restriction": {
    "period": {
      "end": "2026-06-30T00:00:00+00:00"
    }
  }
}
```

Returns the created FHIR Task resource including the assigned OpenSRP UUID.

---

## Example: Register a Catchment Asset

```json
{
  "resourceType": "Location",
  "status": "active",
  "name": "Borehole Pump, Village Musanze North",
  "description": "Community water point serving 340 households",
  "type": [{ "text": "Water Point" }],
  "position": {
    "longitude": 29.5833,
    "latitude": -1.4997
  }
}
```

---

## Real-World Use Cases

**WASH (SDG 6.1):** Register boreholes as catchment assets. Assign urgent repair tasks to water engineers the moment a contamination observation is logged offline.

**Epidemic Control (SDG 3.3):** Search resident cohorts by village and vaccination status. Mass-deploy chemoprophylaxis tasks to all CHWs in active transmission zones.

**Agritech Extension (SDG 2.4):** Group smallholder farmers by crop cycle. Schedule seasonal advisory visits on extension workers' offline task lists.

**Humanitarian Intake (SDG 10.2):** Enroll displaced persons into longitudinal case records. Track aid distribution history across the full duration of a camp stay.

---

## Compatibility

- **OpenSRP:** FHIR R4 compatible instances (Keycloak-secured)
- **n8n:** 1.0+
- **Node.js:** 22+

---

## API Reference

```
POST /fhir/Location
GET  /fhir/Location/{id}
GET  /fhir/Practitioner
GET  /fhir/Practitioner/{id}
POST /fhir/Task
GET  /fhir/Task/{id}
GET  /fhir/Task?status=completed&_lastUpdated=gt{timestamp}
GET  /fhir/Patient/{id}
GET  /fhir/Patient?_tag={locationId}
POST /fhir/Patient
GET  /fhir/Encounter?subject={id}&_count=50
```

---

## Resources

- [OpenSRP Documentation](https://opensrp.io/)
- [OpenSRP GitHub](https://github.com/OpenSRP)
- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [n8n-nodes-openmrs](https://www.npmjs.com/package/n8n-nodes-openmrs) OpenMRS integration

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m 'feat(opensrp): your change'`
4. Push and open a Pull Request

---

## Support

- **Issues:** [GitHub Issues](https://github.com/<your-github-username>/n8n-nodes-opensrp/issues)
- **n8n Community:** [community.n8n.io](https://community.n8n.io/)

---

## License

[MIT](LICENSE) © 2026 [Monfort Brian N. | 宁俊](https://github.com/monfortbrian)

---

## Acknowledgments

Built to connect community field operations to national health and humanitarian infrastructure. Part of an open-source interoperability stack for outbreak response, WASH asset management, and last-mile service delivery across low-resource settings.