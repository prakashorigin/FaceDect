const StatCard = ({ title, value, description, icon, trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">{icon}</div>

        {trend && <span className="stat-trend">{trend}</span>}
      </div>

      <div className="stat-content">
        <span className="stat-title">{title}</span>

        <h2>{value}</h2>

        <p>{description}</p>
      </div>
    </div>
  );
};

export default StatCard;
