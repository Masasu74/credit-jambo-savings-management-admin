import SelectField from "./SelectField";
import rwandaData from "/src/assets/rwanda-relation.json"

const locationData = rwandaData.location_data;

const AddressForm = ({ address, setAddress }) => {
  // Get parent ID from name for hierarchical filtering
  const getParentId = (name, locationType) => {
    const location = locationData.find(
      (loc) => loc.name === name && loc.location_type === locationType
    );
    return location ? location.id : null;
  };

  // Province options
  const provinceOptions = locationData
    .filter((loc) => loc.location_type === "Province")
    .map((p) => ({
      value: p.name,
      label: p.name,
    }));

  // District options based on selected province
  const provinceId = getParentId(address.province, "Province");
  const districtOptions = provinceId
    ? locationData
        .filter(
          (loc) =>
            loc.location_type === "District" && loc.parent_id === provinceId
        )
        .map((d) => ({
          value: d.name,
          label: d.name,
        }))
    : [];

  // Sector options based on selected district
  const districtId = getParentId(address.district, "District");
  const sectorOptions = districtId
    ? locationData
        .filter(
          (loc) =>
            loc.location_type === "Sector" && loc.parent_id === districtId
        )
        .map((s) => ({
          value: s.name,
          label: s.name,
        }))
    : [];

  // Cell options based on selected sector
  const sectorId = getParentId(address.sector, "Sector");
  const cellOptions = sectorId
    ? locationData
        .filter(
          (loc) => loc.location_type === "Cell" && loc.parent_id === sectorId
        )
        .map((c) => ({
          value: c.name,
          label: c.name,
        }))
    : [];

  // Village options based on selected cell
  const cellId = getParentId(address.cell, "Cell");
  const villageOptions = cellId
    ? locationData
        .filter(
          (loc) => loc.location_type === "Village" && loc.parent_id === cellId
        )
        .map((v) => ({
          value: v.name,
          label: v.name,
        }))
    : [];

  return (
    <div className="flex gap-3 flex-wrap">
      <SelectField
        label="Province"
        value={address.province}
        onChange={(e) =>
          setAddress({
            ...address,
            province: e.target.value,
            district: "",
            sector: "",
            cell: "",
            village: "",
          })
        }
        options={provinceOptions}
        required
      />

      <SelectField
        label="District"
        value={address.district}
        onChange={(e) =>
          setAddress({
            ...address,
            district: e.target.value,
            sector: "",
            cell: "",
            village: "",
          })
        }
        options={districtOptions}
        disabled={!address.province}
        required
      />

      <SelectField
        label="Sector"
        value={address.sector}
        onChange={(e) =>
          setAddress({
            ...address,
            sector: e.target.value,
            cell: "",
            village: "",
          })
        }
        options={sectorOptions}
        disabled={!address.district}
        required
      />

      <SelectField
        label="Cell"
        value={address.cell}
        onChange={(e) =>
          setAddress({
            ...address,
            cell: e.target.value,
            village: "",
          })
        }
        options={cellOptions}
        disabled={!address.sector}
        required
      />

      <SelectField
        label="Village"
        value={address.village}
        onChange={(e) =>
          setAddress({
            ...address,
            village: e.target.value,
          })
        }
        options={villageOptions}
        disabled={!address.cell}
        required
      />
    </div>
  );
};

export default AddressForm;