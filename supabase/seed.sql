insert into component_rules (category, ideal_specs, avoid_rules, upgrade_notes) values
('GPU', '{"vram":"16GB+","encoder":"modern NVENC/AV1"}', '{"vram":"avoid <12GB for AI workloads"}', 'VRAM is the main local AI bottleneck.'),
('RAM', '{"capacity":"64GB","speed":"DDR5-6000 CL30"}', '{"capacity":"avoid <32GB"}', 'Prefer stable EXPO kits.'),
('SSD', '{"capacity":"2TB+","interface":"PCIe 4.0 NVMe"}', '{"price":"avoid unless near historic lows"}', 'Model files and datasets fill drives quickly.'),
('PSU', '{"wattage":"850W+","standard":"ATX 3.x"}', '{"quality":"avoid unknown low-tier units"}', 'Quality and transient headroom beat lowest price.'),
('Motherboard', '{"socket":"AM5","wifi":true,"m2Slots":"3+"}', '{"vrm":"avoid weak VRM"}', 'Good AM5 boards support future CPU upgrades.'),
('CPU', '{"platform":"AM5","cores":"6-12"}', '{"platform":"avoid dead-end platforms unless discounted"}', 'Buy near recurring sale lows.'),
('Case', '{"airflow":"mesh front","clearance":"large GPUs"}', '{"airflow":"avoid closed fronts"}', 'Airflow and value matter most.'),
('CPU cooler', '{"type":"dual-tower air"}', '{"value":"avoid overpriced small AIOs"}', 'Strong air coolers go on sale often.')
on conflict do nothing;
