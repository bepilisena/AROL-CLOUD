import SensorData from "../../../models/SensorData";

export default function Dot(props: any) {
  const { cx, cy, fill } = props;

  let sensorDataPayload = props.payload as SensorData;

  let dotType, entryInternalName;
  if (Object.keys(sensorDataPayload.aggregationData).length > 0) {
    dotType = "aggregation";
  } else {
    dotType = "sensor";
    entryInternalName = props.dataKey.substring(8);
  }

  return (
    <>
      {dotType === "sensor" &&
        sensorDataPayload.activeData.hasOwnProperty(entryInternalName) &&
        sensorDataPayload.allData[entryInternalName] !== null && (
          <svg x={cx - 3} y={cy - 3} width={15} height={15} fill={fill} viewBox="0 0 256 256">
            <path d="M 25, 50 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0" />
          </svg>
        )}
      {dotType === "aggregation" && (
        <svg x={cx - 6} y={cy - 6} width={30} height={30} fill={fill} viewBox="0 0 256 256">
          <path d="M 25, 50 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0" />
        </svg>
      )}
    </>
  );
}
